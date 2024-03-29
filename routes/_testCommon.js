"use strict";

const db = require("../db.js");
const User = require("../models/user.js");
const Company = require("../models/company.js");
const Job = require("../models/job.js");
const { createToken } = require("../helpers/tokens.js");


async function commonBeforeAll() {
  await db.query("DELETE FROM applications");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM jobs");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies");
  await db.query("ALTER SEQUENCE jobs_id_seq RESTART WITH 1");

  await Company.create(
    {
      handle: "c1",
      name: "C1",
      numEmployees: 1,
      description: "Desc1",
      logoUrl: "http://c1.img",
    });
  await Company.create(
    {
      handle: "c2",
      name: "C2",
      numEmployees: 2,
      description: "Desc2",
      logoUrl: "http://c2.img",
    });
  await Company.create(
    {
      handle: "c3",
      name: "C3",
      numEmployees: 3,
      description: "Desc3",
      logoUrl: "http://c3.img",
    });

  await User.register({
    username: "u1",
    firstName: "U1F",
    lastName: "U1L",
    email: "user1@user.com",
    password: "password1",
    isAdmin: false,
  });
  await User.register({
    username: "u2",
    firstName: "U2F",
    lastName: "U2L",
    email: "user2@user.com",
    password: "password2",
    isAdmin: false,
  });
  await User.register({
    username: "u3",
    firstName: "U3F",
    lastName: "U3L",
    email: "user3@user.com",
    password: "password3",
    isAdmin: false,
  });
  await User.register({
    username: "u4admin",
    firstName: "U4F",
    lastName: "U4L",
    email: "user4@user.com",
    password: "password3",
    isAdmin: true,
  });
  const job1 = await Job.create({
    title: "j1",
    salary: "60000",
    equity: 0,
    companyHandle: "c1"
  });

  await Job.create({
    title: "j2",
    salary: "100000",
    equity: 0.5,
    companyHandle: "c1"
  });
  await Job.create({
    title: "j3",
    salary: "45000",
    equity: 0.04,
    companyHandle: "c2"
  });
  await User.apply("u1", 1)
  await User.apply("u1", 2)
  await User.apply("u2", 1)
  await User.apply("u2", 3)
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}

const u1Token = createToken({ username: "u1", isAdmin: false });
const adminToken = createToken({ username: "u4admin", isAdmin: true });

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken

};
