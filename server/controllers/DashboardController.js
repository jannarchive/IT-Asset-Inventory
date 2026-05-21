import Dashboard from "../models/Dashboard.js";

class DashboardController {
  /**
   * GET /api/dashboard/stats
   * Returns totals for the four status cards.
   */
  static async getDashboardStats(req, res) {
    try {
      const data = await Dashboard.getDashboardStats();
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("[DashboardController] getDashboardStats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch dashboard statistics.",
      });
    }
  }

  /**
   * GET /api/dashboard/asset-types
   * Returns asset type names with their asset counts (used by the bar graph).
   */
  static async getAssetTypesCounts(req, res) {
    try {
      const data = await Dashboard.getAssetTypesCounts();
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("[DashboardController] getAssetTypesCounts:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch asset type counts.",
      });
    }
  }

  /**
   * GET /api/dashboard/recent-activities?limit=15
   * Returns the most recent activity log entries.
   * Query param `limit` must be an integer between 1 and 100.
   */
  static async getRecentActivities(req, res) {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 15;

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: "Query param 'limit' must be an integer between 1 and 100.",
      });
    }

    try {
      const data = await Dashboard.getRecentActivities(limit);
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("[DashboardController] getRecentActivities:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch recent activities.",
      });
    }
  }
}

export default DashboardController;