require("dotenv").config();
const Sequelize = require("sequelize");

let sequelize = new Sequelize(
  process.env.PGDATABASE,
  process.env.PGUSER,
  process.env.PGPASSWORD,
  {
    host: process.env.PGHOST,
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
  }
);

const Theme = sequelize.define("Theme", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: Sequelize.STRING,
});

const Set = sequelize.define("Set", {
  set_num: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  name: Sequelize.STRING,
  year: Sequelize.INTEGER,
  num_parts: Sequelize.INTEGER,
  theme_id: Sequelize.INTEGER,
  img_url: Sequelize.STRING,
});

Set.belongsTo(Theme, { foreignKey: "theme_id" });

async function Initialize() {
  return sequelize.sync();
}

function getAllSets() {
  return Set.findAll({ include: [Theme] });
}

function getSetByNum(setNum) {
  return Set.findOne({
    where: { set_num: setNum },
    include: [Theme],
  }).then((set) => {
    if (set) {
      return set;
    } else {
      throw new Error("Unable to find requested set");
    }
  });
}

function getSetByNum(setNum) {
  return Set.findOne({
    where: { set_num: setNum },
    include: [Theme],
  }).then((set) => {
    if (set) {
      return set;
    } else {
      throw new Error("Unable to find requested set");
    }
  });
}

function getSetsByTheme(theme) {
  return Set.findAll({
    include: [Theme],
    where: {
      "$Theme.name$": {
        [Sequelize.Op.iLike]: `%${theme}%`,
      },
    },
  });
}

// New function to add a set
function addSet(setData) {
  return Set.create(setData)
    .then(() => {})
    .catch((err) => {
      throw new Error(err.errors[0].message);
    });
}

// New function to get all themes
function getAllThemes() {
  return Theme.findAll();
}

async function editSet(setNum, setData) {
  try {
    const updatedSet = await Set.update(setData, {
      where: { set_num: setNum },
      returning: true, // Return the updated set
      plain: true, // Return only the updated set (not an array)
    });

    if (updatedSet && updatedSet[1] && updatedSet[1].dataValues) {
      // Successfully updated the set
      return updatedSet[1].dataValues;
    } else {
      throw new Error("Set not found or not updated.");
    }
  } catch (error) {
    throw new Error(`Unable to update the set: ${error.message}`);
  }
}

async function deleteSet(setNum) {
  try {
    const deletedSetCount = await Set.destroy({
      where: { set_num: setNum },
    });

    if (deletedSetCount > 0) {
      // Successfully deleted the set
      return;
    } else {
      throw new Error("Set not found or not deleted.");
    }
  } catch (error) {
    throw new Error(`Unable to delete the set: ${error.message}`);
  }
}

module.exports = {
  Initialize,
  getAllSets,
  getSetByNum,
  getSetsByTheme,
  addSet,
  getAllThemes,
  editSet,
  deleteSet,
};
