
const mongoose = require("mongoose");

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      unique: true,
      immutable: true
    },
    companyName: {
      type: String,
      required: true,
      trim: true
    },
    jobRole: {
      type: String,
      required: true,
      trim: true
    },
    jobType: {
      type: String,
      required: true,
      enum: ["Full-time", "Internship", "Contract"]
    },
    appliedDate: {
      type: Date,
      required: true,
      validate: {
        validator: value => value <= new Date(),
        message: "Applied date cannot be in the future"
      }
    },
    expectedSalary: {
      type: Number,
      min: 0,
      default: null
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: [
        "Applied",
        "Interview",
        "Offer",
        "Rejected",
        "Accepted",
        "Declined"
      ],
      default: "Applied"
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: function () {
        return [{ status: "Applied", changedAt: new Date() }];
      }
    }
  },
  { timestamps: true }
);

applicationSchema.virtual("followUpDate").get(function () {
  const date = new Date(this.appliedDate);
  date.setDate(date.getDate() + 7);
  return date;
});

applicationSchema.virtual("isOverdue").get(function () {
  return (
    this.status === "Applied" &&
    this.followUpDate < new Date()
  );
});

applicationSchema.set("toJSON", { virtuals: true });
applicationSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Application", applicationSchema);
