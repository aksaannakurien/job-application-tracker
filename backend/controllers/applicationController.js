
const Application = require("../models/application");

const FINAL_STATUSES = ["Rejected", "Accepted", "Declined"];
const ACTIVE_STATUSES = ["Applied", "Interview", "Offer"];

const TRANSITIONS = {
  Applied: ["Interview", "Rejected"],
  Interview: ["Offer", "Rejected"],
  Offer: ["Accepted", "Declined"]
};

const send = (res, status, success, message, data = null) =>
  res.status(status).json({ success, message, data });

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Generate a unique application ID for each company
const makeId = async (companyName) => {
  const prefix = companyName
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 3)
    .toUpperCase();

  if (prefix.length < 3) {
    throw new Error("Company name must contain at least 3 letters");
  }

  const existing = await Application.find({
    companyName: {
      $regex: `^${escapeRegex(companyName.trim())}$`,
      $options: "i"
    },
    applicationId: { $regex: `^JA-${prefix}-\\d{3}$` }
  }).select("applicationId");

  const sequence =
    existing.reduce((max, item) => {
      const number = Number(item.applicationId.slice(-3));
      return Math.max(max, number);
    }, 0) + 1;

  if (sequence > 999) {
    throw new Error("Application ID limit reached");
  }

  return `JA-${prefix}-${String(sequence).padStart(3, "0")}`;
};

// Validate that the applied date is not in the future
const isPastOrToday = (date) => {
  const d = new Date(date);
  const today = new Date();

  today.setHours(23, 59, 59, 999);

  return !Number.isNaN(d.getTime()) && d <= today;
};

// GET all applications with search and filtering
exports.getApplications = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.company) {
      filter.companyName = {
        $regex: escapeRegex(req.query.company),
        $options: "i"
      };
    }

    const applications = await Application.find(filter)
      .sort({ createdAt: -1 });

    return send(res, 200, true, "Applications retrieved", applications);
  } catch (error) {
    return send(res, 400, false, error.message);
  }
};

// GET one application
exports.getApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return send(res, 404, false, "Application not found");
    }

    return send(res, 200, true, "Application retrieved", application);
  } catch {
    return send(res, 400, false, "Invalid application ID");
  }
};

// POST create an application
exports.createApplication = async (req, res) => {
  try {
    const {
      companyName,
      jobRole,
      jobType,
      appliedDate,
      expectedSalary,
      notes
    } = req.body;

    if (
      !companyName?.trim() ||
      !jobRole?.trim() ||
      !jobType ||
      !appliedDate
    ) {
      return send(
        res,
        400,
        false,
        "Company, role, type and applied date are required"
      );
    }

    if (!isPastOrToday(appliedDate)) {
      return send(
        res,
        400,
        false,
        "Applied date cannot be in the future"
      );
    }

    const duplicate = await Application.findOne({
      companyName: {
        $regex: `^${escapeRegex(companyName.trim())}$`,
        $options: "i"
      },
      jobRole: {
        $regex: `^${escapeRegex(jobRole.trim())}$`,
        $options: "i"
      },
      status: { $in: ACTIVE_STATUSES }
    });

    if (duplicate) {
      return send(
        res,
        409,
        false,
        "An active application already exists for this company and role"
      );
    }

    // Generate ID and initial status on the backend
    const applicationId = await makeId(companyName.trim());

    const application = await Application.create({
      applicationId,
      companyName: companyName.trim(),
      jobRole: jobRole.trim(),
      jobType,
      appliedDate,
      expectedSalary:
        expectedSalary === "" || expectedSalary == null
          ? null
          : Number(expectedSalary),
      notes: notes || "",
      status: "Applied",
      statusHistory: [
        {
          status: "Applied",
          changedAt: new Date()
        }
      ]
    });

    return send(
      res,
      201,
      true,
      "Application created successfully",
      application
    );
  } catch (error) {
    return send(res, 400, false, error.message);
  }
};

// PUT edit permitted application fields only
exports.updateApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return send(res, 404, false, "Application not found");
    }

    const allowed = [
      "companyName",
      "jobRole",
      "jobType",
      "expectedSalary",
      "notes"
    ];

    const nextCompany =
      req.body.companyName !== undefined
        ? String(req.body.companyName).trim()
        : application.companyName;

    const nextRole =
      req.body.jobRole !== undefined
        ? String(req.body.jobRole).trim()
        : application.jobRole;

    if (!nextCompany || !nextRole) {
      return send(res, 400, false, "Company and role are required");
    }

    if (ACTIVE_STATUSES.includes(application.status)) {
      const duplicate = await Application.findOne({
        _id: { $ne: application._id },
        companyName: {
          $regex: `^${escapeRegex(nextCompany)}$`,
          $options: "i"
        },
        jobRole: {
          $regex: `^${escapeRegex(nextRole)}$`,
          $options: "i"
        },
        status: { $in: ACTIVE_STATUSES }
      });

      if (duplicate) {
        return send(
          res,
          409,
          false,
          "An active application already exists for this company and role"
        );
      }
    }

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        application[field] = req.body[field];
      }
    }

    await application.save();

    return send(res, 200, true, "Application updated", application);
  } catch (error) {
    return send(res, 400, false, error.message);
  }
};

// PATCH update status using permitted transitions
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const application = await Application.findById(req.params.id);

    if (!application) {
      return send(res, 404, false, "Application not found");
    }

    const allowed = TRANSITIONS[application.status] || [];

    if (!allowed.includes(status)) {
      return send(
        res,
        400,
        false,
        `Cannot change status from ${application.status} to ${status}`
      );
    }

    application.status = status;

    application.statusHistory.push({
      status,
      changedAt: new Date()
    });

    await application.save();

    return send(res, 200, true, "Status updated", application);
  } catch (error) {
    return send(res, 400, false, error.message);
  }
};

// DELETE only Applied or final-status applications
exports.deleteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return send(res, 404, false, "Application not found");
    }

    if (
      !["Applied", ...FINAL_STATUSES].includes(application.status)
    ) {
      return send(
        res,
        400,
        false,
        "Only Applied or final-status applications can be deleted"
      );
    }

    await application.deleteOne();

    return send(res, 200, true, "Application deleted", null);
  } catch {
    return send(res, 400, false, "Invalid application ID");
  }
};

// GET counts for all statuses
exports.getStats = async (req, res) => {
  try {
    const stats = await Application.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      Applied: 0,
      Interview: 0,
      Offer: 0,
      Rejected: 0,
      Accepted: 0,
      Declined: 0
    };

    stats.forEach((item) => {
      result[item._id] = item.count;
    });

    return send(
      res,
      200,
      true,
      "Application statistics retrieved",
      result
    );
  } catch (error) {
    return send(res, 400, false, error.message);
  }
};

