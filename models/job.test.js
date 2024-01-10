"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
        title: "new",
        salary: 75000,
        equity: 0.5,
        companyHandle: "c1"
    };

    test("works", async function () {
        let job = await Job.create(newJob);
        let jobID = job.id
        expect(job).toEqual({
            id: expect.any(Number),
            title: "new",
            salary: 75000,
            equity: "0.5",
            companyHandle: "c1"
        });

        const result = await db.query(
            `SELECT id, 
            title, 
            salary, 
            equity, 
            company_handle AS "companyHandle"
            FROM jobs
           WHERE id = $1`, [jobID])
        expect(result.rows).toEqual([
            {
                id: jobID,
                title: "new",
                salary: 75000,
                equity: "0.5",
                companyHandle: "c1"
            },
        ]);
    });

    test("bad request with fake company", async function () {
        try {
            newJob.companyHandle = 'fake'
            await Job.create(newJob);
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

// /************************************** findAll */

describe("findAll", function () {
    test("works: no filter", async function () {
        let jobs = await Job.findAll({});
        expect(jobs).toEqual([
            {
                id: 1,
                title: "j1",
                salary: 60000,
                equity: "0",
                companyHandle: "c1"
            },
            {
                id: 2,
                title: "j2",
                salary: 100000,
                equity: "0.5",
                companyHandle: "c1"
            },
            {
                id: 3,
                title: "j3",
                salary: 45000,
                equity: "0.04",
                companyHandle: "c3"
            },
        ]);
    });
    test("works: only 1 filter", async function () {
        let jobs = await Job.findAll({ title: "j" });
        expect(jobs).toEqual([
            {
                id: 1,
                title: "j1",
                salary: 60000,
                equity: "0",
                companyHandle: "c1"
            },
            {
                id: 2,
                title: "j2",
                salary: 100000,
                equity: "0.5",
                companyHandle: "c1"
            },
            {
                id: 3,
                title: "j3",
                salary: 45000,
                equity: "0.04",
                companyHandle: "c3"
            },
        ]);
    });
    test("works: 2 filters", async function () {
        let jobs = await Job.findAll({ title: "j", minSalary: 60000 });
        expect(jobs).toEqual([
            {
                id: 1,
                title: "j1",
                salary: 60000,
                equity: "0",
                companyHandle: "c1"
            },
            {
                id: 2,
                title: "j2",
                salary: 100000,
                equity: "0.5",
                companyHandle: "c1"
            }
        ]);
    });
    test("works: all 3 filters", async function () {
        let jobs = await Job.findAll({ name: "j", minSalary: 60000, hasEquity: true });
        expect(jobs).toEqual([{
            id: 2,
            title: "j2",
            salary: 100000,
            equity: "0.5",
            companyHandle: "c1"
        }]);
    });
});

/************************************** get */

describe("get", function () {
    test("works", async function () {
        let job = await Job.get(1);
        expect(job).toEqual({
            id: 1,
            title: "j1",
            salary: 60000,
            equity: "0",
            companyHandle: "c1"
        });
    });

    test("not found if no such job", async function () {
        try {
            await Job.get(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

// /************************************** update */

describe("update", function () {
    const updateData = {
        title: "New",
        salary: 50000,
        equity: "0",
        companyHandle: 'c1'
    };

    test("works", async function () {
        let job = await Job.update(1, updateData);
        expect(job).toEqual({
            id: 1,
            ...updateData
        });

        const result = await db.query(
            `SELECT id, 
            title, 
            salary, 
            equity, 
            company_handle AS "companyHandle"
            FROM jobs
           WHERE id = 1`);
        expect(result.rows).toEqual([{
            id: 1,
            title: "New",
            salary: 50000,
            equity: "0",
            companyHandle: "c1"
        }]);
    });

    test("works: null fields", async function () {
        const updateDataSetNulls = {
            title: "New",
            salary: null,
            equity: null,
            companyHandle: "c1"
        };

        let job = await Job.update(1, updateDataSetNulls);
        expect(job).toEqual({
            id: 1,
            ...updateDataSetNulls,
        });

        const result = await db.query(
            `SELECT id, 
            title, 
            salary, 
            equity, 
            company_handle AS "companyHandle"
            FROM jobs
           WHERE id = 1`);
        expect(result.rows).toEqual([{
            id: 1,
            title: "New",
            salary: null,
            equity: null,
            companyHandle: "c1"
        }]);
    });

    test("not found if no such job", async function () {
        try {
            await Job.update(0, updateData);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request with no data", async function () {
        try {
            await Job.update(1, {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

// /************************************** remove */

describe("remove", function () {
    test("works", async function () {
        await Job.remove(1);
        const res = await db.query(
            "SELECT id FROM jobs WHERE id=1");
        expect(res.rows.length).toEqual(0);
    });

    test("not found if no such job", async function () {
        try {
            await Job.remove(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
})
