import Report from '../models/Report.model.js';

// Get all reports with filtering options
export const getReports = async (req, res) => {
  try {
    const { patientId, doctorId, reportType, status } = req.query;
    const filter = {};

    if (patientId) filter.patientId = patientId;
    if (doctorId) filter.doctorId = doctorId;
    if (reportType) filter.reportType = reportType;
    if (status) filter.status = status;

    const reports = await Report.find(filter)
      .populate('doctorId', 'name specialization')
      .populate('patientId', 'name')
      .sort({ issuedDate: -1 });
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get report by ID
export const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('doctorId', 'name specialization')
      .populate('patientId', 'name');
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new report
export const createReport = async (req, res) => {
  try {
    const reportData = {
      ...req.body,
      doctorId: req.user._id,
      doctorName: req.user.name
    };

    const report = new Report(reportData);
    await report.save();

    res.status(201).json(report);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update report
export const updateReport = async (req, res) => {
  try {
    const { findings, conclusion, status } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (findings) report.findings = findings;
    if (conclusion) report.conclusion = conclusion;
    if (status) report.status = status;

    await report.save();
    res.status(200).json(report);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete report
export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    await report.deleteOne();
    res.status(200).json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update report status
export const updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.status = status;
    await report.save();
    res.status(200).json(report);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};