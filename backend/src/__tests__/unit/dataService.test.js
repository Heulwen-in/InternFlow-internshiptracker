const { parseCsv } = require("../../services/dataService");

describe("dataService.parseCsv", () => {
  test("parses quoted CSV cells", () => {
    const rows = parseCsv('company,roleTitle,location\n"Acme, Inc","Frontend Intern","Remote"');

    expect(rows).toEqual([
      {
        company: "Acme, Inc",
        roletitle: "Frontend Intern",
        location: "Remote",
      },
    ]);
  });
});
