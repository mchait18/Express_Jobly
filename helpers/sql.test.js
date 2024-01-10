const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

describe("get sql for partial update", function () {
    test("works: all fields filled out", function () {
        const updateData = {
            firstName: "NewF",
            lastName: "NewF",
            email: "new@email.com",
            isAdmin: true
        };
        const { setCols, values } = sqlForPartialUpdate(
            updateData,
            {
                firstName: "first_name",
                lastName: "last_name",
                isAdmin: "is_admin"
            });
        expect(setCols).toEqual('"first_name"=$1, "last_name"=$2, "email"=$3, "is_admin"=$4');
        expect(values).toEqual(["NewF", "NewF", "new@email.com", true]);
    });

    test("works: some fields", function () {
        const updateData = {
            firstName: "NewF",
            isAdmin: true
        };
        const { setCols, values } = sqlForPartialUpdate(
            updateData,
            {
                firstName: "first_name",
                lastName: "last_name",
                isAdmin: "is_admin",
            });
        expect(setCols).toEqual('"first_name"=$1, "is_admin"=$2');
        expect(values).toEqual(["NewF", true]);

    });

    test("works: no fields, throws BadRequestError", function () {
        const updateData = {};
        try {
            const { setCols, values } = sqlForPartialUpdate(
                updateData,
                {
                    firstName: "first_name",
                    lastName: "last_name",
                    isAdmin: "is_admin",
                });
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});
