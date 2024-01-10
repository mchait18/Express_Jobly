"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
    /** Create a job (from data), update db, return new job data.
     *
     * data should be { title, salary, equity, company_handle }
     *
     * Returns {id, title, salary, equity, company_handle }
     *
     * Throws BadRequestError if job already in database.
     * */

    static async create({ title, salary, equity, companyHandle }) {
        const handleCheck = await db.query(
            `SELECT handle
           FROM companies
           WHERE handle = $1`,
            [companyHandle]);
        if (!handleCheck.rows[0])
            throw new BadRequestError(`No such company: ${companyHandle}`);

        const result = await db.query(
            `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [
                title,
                salary,
                equity,
                companyHandle
            ],
        );
        const job = result.rows[0];

        return job;
    }

    /** Find all jobs.
     *if there is one or more filter words in the query string, it will filter by that parameter(s)
     * Returns [{id, title, salary, equity, company_handle }, ...]
     * */

    static async findAll(q) {
        let filterStr = ""
        //if all 3 filters are in the query string, filter by all. If just one or 2, filter by those
        if (q.title && q.minSalary && q.hasEquity)
            filterStr = `WHERE title ILIKE '%${q.title}%' 
        AND salary >= ${q.minSalary} 
        AND equity > 0`

        else if (q.title && q.minSalary)
            filterStr = `WHERE title ILIKE '%${q.title}%' 
         AND salary >= ${q.minSalary}`

        else if (q.title && q.hasEquity)
            filterStr = `WHERE title ILIKE '%${q.title}%'  
         AND equity > 0`

        else if (q.minSalary && q.hasEquity)
            filterStr = `WHERE salary >= ${q.minSalary} 
            AND equity > 0`
        else if (q.title)
            filterStr = `WHERE title ILIKE '%${q.title}%'`
        else if (q.minSalary)
            filterStr = `WHERE salary >= ${q.minSalary}`
        else if (q.hasEquity)
            filterStr = `WHERE equity > 0`

        //filter string has the extra filters or is empty
        const jobsRes = await db.query(
            `SELECT id, 
             title, 
             salary, 
             equity, 
             company_handle AS "companyHandle"
             FROM jobs ${filterStr}
             ORDER BY title`);
        return jobsRes.rows;
    }

    /** Given a job id, return data about job.
     *
     * Returns {id, title, salary, equity, company_handle }
     *   
     *
     * Throws NotFoundError if not found.
     **/

    static async get(id) {
        const jobRes = await db.query(
            `SELECT id, 
            title, 
            salary, 
            equity, 
            company_handle AS "companyHandle"
            FROM jobs
           WHERE id = $1`,
            [id]);

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }

    /** Update job data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: { title, salary, equity, }
     *
     * Returns {id, title, salary, equity, company_handle}
     *
     * Throws NotFoundError if not found.
     */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
                companyHandle: "company_handle"
            });
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                      title, 
                      salary, 
                      equity, 
                      company_handle  AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No company: ${id}`);

        return job;
    }

    /** Delete given job from database; returns undefined.
     *
     * Throws NotFoundError if job not found.
     **/

    static async remove(id) {
        const result = await db.query(
            `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
            [id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);
    }
}

module.exports = Job;
