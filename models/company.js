"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [
        handle,
        name,
        description,
        numEmployees,
        logoUrl,
      ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *if there is one or more filter words in the query string, it will filter by that parameter(s)
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(q) {
    let filterStr = ""
    //if minEmployees is greater than maxEmployees, throw an error         
    if (q.minEmployees && q.maxEmployees && q.minEmployees > q.maxEmployees)
      throw new BadRequestError("Min Employees is greater than Max Employees")
    //if all 3 filters are in the query string, filter by all. If just one or 2, filter by those
    if (q.name && q.minEmployees && q.maxEmployees)
      filterStr = `WHERE name ILIKE '%${q.name}%' 
    AND num_employees >= ${q.minEmployees} 
    AND num_employees <= ${q.maxEmployees}`

    else if (q.name && q.minEmployees)
      filterStr = `WHERE name ILIKE '%${q.name}%' 
      AND num_employees >= ${q.minEmployees}`

    else if (q.name && q.maxEmployees)
      filterStr = `WHERE name ILIKE '%${q.name}%'  
     AND num_employees <= ${q.maxEmployees}`

    else if (q.minEmployees && q.maxEmployees)
      filterStr = `WHERE num_employees >= ${q.minEmployees} 
      AND num_employees <= ${q.maxEmployees}`
    else if (q.name)
      filterStr = `WHERE name ILIKE '%${q.name}%'`
    else if (q.minEmployees)
      filterStr = `WHERE num_employees >= ${q.minEmployees}`
    else if (q.maxEmployees)
      filterStr = `WHERE num_employees <= ${q.maxEmployees}`

    //filter string has the extra filters or is empty
    const companiesRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies ${filterStr}
           ORDER BY name`);
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    const compJobs = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
      FROM jobs WHERE company_handle = $1`, [handle]);

    const jobData = compJobs.rows

    if (jobData[0]) {
      company.jobs = jobData.map(d => ({
        id: d.id,
        title: d.title,
        salary: d.salary,
        equity: d.equity,
        companyHandle: d.companyHandle
      }))
    }
    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
