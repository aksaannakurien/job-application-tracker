
const express = require("express");
const router = express.Router();
const controller = require("../controllers/applicationController");

router.get("/stats", controller.getStats);
router.get("/", controller.getApplications);
router.get("/:id", controller.getApplication);
router.post("/", controller.createApplication);
router.put("/:id", controller.updateApplication);
router.patch("/:id/status", controller.updateStatus);
router.delete("/:id", controller.deleteApplication);

module.exports = router;
