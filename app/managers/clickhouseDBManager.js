const fs = require('fs');
const config = require('config');
const {ClickHouse} = require('clickhouse');
const {buildQuery} = require('../helpers/buildQuery');

const clickhouse = new ClickHouse(config.clickhouse);

const initSlon = fs.readFileSync('./app/managers/queries/initDB/initSlon.sql', 'utf-8');
const initMviews = fs.readFileSync('./app/managers/queries/initDB/initMviews.sql', 'utf-8');
const initReports = fs.readFileSync('./app/managers/queries/initDB/initReports.sql', 'utf-8');
const initSlonFacts = fs.readFileSync('./app/managers/queries/initDB/initSlonFacts.sql', 'utf-8');
const initSlonR_tags_v2 = fs.readFileSync('./app/managers/queries/initDB/initSlonR_tags_v2.sql', 'utf-8');
const initMviewsCalltracking = fs.readFileSync('./app/managers/queries/initDB/initMviewsCalltracking.sql', 'utf-8');
const initReportsHistory = fs.readFileSync('./app/managers/queries/initDB/initReportsHistory.sql', 'utf-8');
const initReportsHistoryTransferred = fs.readFileSync('./app/managers/queries/initDB/initReportsHistoryTransferred.sql', 'utf-8');


/**
 * Initiate database
 */
(async function query() {
    await clickhouse.query(initSlon).toPromise();
    await clickhouse.query(initMviews).toPromise();
    await clickhouse.query(initReports).toPromise();
    await clickhouse.query(initSlonFacts).toPromise();
    await clickhouse.query(initSlonR_tags_v2).toPromise();
    await clickhouse.query(initMviewsCalltracking).toPromise();
    await clickhouse.query(initReportsHistory).toPromise();
    await clickhouse.query(initReportsHistoryTransferred).toPromise();
})()

/**
 * Get all names databases from memory
 * @return {Promise}
 */
async function getDatabasesListFromDB() {
    const query = `SELECT name
                   FROM system.databases
                   WHERE name NOT IN ('system', 'default', 'reports')`;
    return clickhouse.query(query).toPromise();
}

exports.getDatabasesListFromDB = getDatabasesListFromDB;

/**
 * Get all names tables from DB
 * @param db
 * @return {Promise}
 */
async function getDatabaseTablesFromDB(db) {
    const query = `SELECT name FROM system.tables WHERE database = '${db}'`;
    return clickhouse.query(query).toPromise();
}

exports.getDatabaseTablesFromDB = getDatabaseTablesFromDB;


const typeMapping = {
    "Date": "Date",
    "String": "String",
    "UInt8": "Number",
    "UInt16": "Number",
    "UInt32": "Number",
    "Array(UInt8)": "[Number]",
    "Array(UInt16)": "[Number]",
    "Array(UInt32)": "[Number]",
}

/**
 * Get all names fields from table
 * @param db
 * @param table
 * @return {Promise}
 */
async function getTableFieldsFromDB(db, table) {
    const query = `SELECT name, type FROM system.columns WHERE database = '${db}' AND table = '${table}'`;
    return clickhouse.query(query).toPromise().then((result) => {
        return result.map((element) => {
            return {name: element.name, type: typeMapping[element.type]};
        });
    });
}

exports.getTableFieldsFromDB = getTableFieldsFromDB;

/**
 * Get fields from table
 * @param params
 * @return {Promise}
 */
async function createReportToDB(params) {
    const query = buildQuery(params);
    return clickhouse.query(query).toPromise();
}

exports.createReportToDB = createReportToDB;


/**
 * Save all reports in DB
 * @param params
 * @param user
 * @return {Promise}
 */
async function saveHistoryReportsToDB(params, user) {
    const query = `INSERT INTO reports.history (id_user, name, request) VALUES ('${user.id}', '${params.name}', '${JSON.stringify(params)}')`;
    return clickhouse.query(query).toPromise();
}

exports.saveHistoryReportsToDB = saveHistoryReportsToDB;

// INSERT INTO reports.transferred (id_user, id_report) VALUES ('1', 'c7cce607-3736-47e3-938f-5bc9bff02094');

/**
 * Get all fields from table
 * @param user
 * @return {Promise}
 */
async function getReportsfromDB(user) {
    let query = user.isAdmin ?
        `SELECT *
         FROM reports.history;` :
        `SELECT * FROM reports.history WHERE id_user = '${user.id}' OR id_report IN (SELECT id_report FROM reports.transferred WHERE id_user = '${user.id}');`;
    return clickhouse.query(query).toPromise();
}

exports.getReportsfromDB = getReportsfromDB;