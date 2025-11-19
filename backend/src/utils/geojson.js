const fs = require('fs').promises;
const path = require('path');

/**
 * Load GeoJSON data for a graveyard
 * @param {number} graveyardId - ID of the graveyard
 * @returns {Promise<Object>} GeoJSON object
 */
async function loadGeoJSON(graveyardId) {
  try {
    const geoDir = path.join(__dirname, '../../../geo');
    const filePath = path.join(geoDir, `graveyard_${graveyardId}.json`);

    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading GeoJSON for graveyard ${graveyardId}:`, error.message);
    return null;
  }
}

/**
 * Save GeoJSON data for a graveyard
 * @param {number} graveyardId - ID of the graveyard
 * @param {Object} geoJSON - GeoJSON object
 */
async function saveGeoJSON(graveyardId, geoJSON) {
  try {
    const geoDir = path.join(__dirname, '../../../geo');
    await fs.mkdir(geoDir, { recursive: true });

    const filePath = path.join(geoDir, `graveyard_${graveyardId}.json`);
    await fs.writeFile(filePath, JSON.stringify(geoJSON, null, 2));

    return true;
  } catch (error) {
    console.error(`Error saving GeoJSON for graveyard ${graveyardId}:`, error.message);
    return false;
  }
}

module.exports = {
  loadGeoJSON,
  saveGeoJSON
};
