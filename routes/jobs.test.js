"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    adminToken
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /jobs", function () {
    const newJob = {
        title: "new",
        salary: 75000,
        equity: 0.5,
        companyHandle: "c1"
    };

    test("ok for admin", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                title: "new",
                salary: 75000,
                equity: "0.5",
                companyHandle: "c1"
            }
        });
    });
    test("unauth for non-admin", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "new",
                salary: 10
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                ...newJob,
                companyHandle: "not-a-comp",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /companies */

describe("GET /jobs", function () {
    test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title: "j1",
                    salary: 60000,
                    equity: "0",
                    companyHandle: "c1"
                },
                {
                    id: expect.any(Number),
                    title: "j2",
                    salary: 100000,
                    equity: "0.5",
                    companyHandle: "c1"
                },
                {
                    id: expect.any(Number),
                    title: "j3",
                    salary: 45000,
                    equity: "0.04",
                    companyHandle: "c2"
                },
            ]
        });
    });

    test("fails: test next() handler", async function () {
        // there's no normal failure event which will cause this route to fail ---
        // thus making it hard to test that the error-handler works with it. This
        // should cause an error, all right :)
        await db.query("DROP TABLE jobs CASCADE");
        const resp = await request(app)
            .get("/jobs")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(500);
    });

    test("throws error: invalid filters", async function () {
        const resp = await request(app)
            .get("/jobs?min=3")
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /companies/:handle */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
        const resp = await request(app).get(`/jobs/1`);
        expect(resp.body).toEqual({
            job: {
                id: 1,
                title: "j1",
                salary: 60000,
                equity: "0",
                companyHandle: "c1"
            },
        });
    });

    test("not found for no such job", async function () {
        const resp = await request(app).get(`/jobs/0`);
        expect(resp.statusCode).toEqual(404);
    });
});

// /************************************** PATCH /companies/:handle */

describe("PATCH /jobs/:id", function () {

    test("works for admin", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                title: "1-new",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({
            job: {
                id: 1,
                title: "1-new",
                salary: 60000,
                equity: "0",
                companyHandle: "c1"
            },
        })
    });

    test("unauth for non-admin", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                title: "1-new",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                title: "1-new",
            });
        expect(resp.statusCode).toEqual(401);
    });

    test("not found on no such job", async function () {
        const resp = await request(app)
            .patch(`/jobs/0`)
            .send({
                title: "new nope",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });

    test("bad request on companyHandle change attempt", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                companyHandle: "c1-new",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request on invalid data", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                salary: "not-a-salary",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

// /************************************** DELETE /companies/:handle */

describe("DELETE /jobs/:id", function () {
    test("works for users", async function () {
        const resp = await request(app)
            .delete(`/jobs/1`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({ deleted: "1" });
    });
    test("unath for non-admin", async function () {
        const resp = await request(app)
            .delete(`/jobs/1`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });
    test("unauth for anon", async function () {
        const resp = await request(app)
            .delete(`/jobs/1`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such job", async function () {
        const resp = await request(app)
            .delete(`/jobs/0`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });
});
