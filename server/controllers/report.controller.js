import Report from '../models/Report.model.js';
import fs from 'fs/promises';
import path from 'path';
import { createReadStream } from 'fs';
import { fileURLToPath } from 'url';

// Get all reports for a patient
export const getReports = async (req, res) => {
  try {
    // Get patientId from query parameters
    const { patientId, reportType } = req.query;

    // Validate patientId
    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    // TODO: Add authorization check: Ensure the requesting user (doctor/admin) is allowed to view this patient's reports.
    // This might involve checking if the doctor is associated with the patient or if the user is an admin.

    const filter = { patientId: patientId };

    if (reportType) filter.reportType = reportType;

    const reports = await Report.find(filter)
      .sort({ issuedDate: -1 });
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get report by ID
export const getReportById = async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      patientId: req.user._id // Restore patient check for security
    });
    
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
    // Log request information for debugging
    console.log('Create report request body:', req.body);
    console.log('Create report request file:', req.file);
    console.log('Form field names:', Object.keys(req.body));
    
    if (!req.file) {
      return res.status(400).json({ message: 'Please provide a file' });
    }

    const reportData = {
      patientId: req.user._id,
      patientName: req.user.name,
      title: req.body.title,
      description: req.body.description,
      reportType: req.body.reportType,
      issuedDate: req.body.issuedDate || new Date(),
      institution: req.body.institution,
      fileUrl: req.file.path,
      fileType: req.file.mimetype,
      fileSize: req.file.size
    };

    const report = new Report(reportData);
    await report.save();

    res.status(201).json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    // Clean up uploaded file if report creation fails
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    res.status(400).json({ message: error.message });
  }
};

// Update report
export const updateReport = async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      patientId: req.user._id // Restore patient check for security
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Update report fields
    if (req.body.title) report.title = req.body.title;
    if (req.body.description) report.description = req.body.description;
    if (req.body.reportType) report.reportType = req.body.reportType;
    if (req.body.issuedDate) report.issuedDate = req.body.issuedDate;
    if (req.body.institution) report.institution = req.body.institution;

    // Handle file update if new file is provided
    if (req.file) {
      // Delete old file
      if (report.fileUrl) {
        await fs.unlink(report.fileUrl).catch(console.error);
      }

      // Update with new file info
      report.fileUrl = req.file.path;
      report.fileType = req.file.mimetype;
      report.fileSize = req.file.size;
    }

    await report.save();
    res.status(200).json(report);
  } catch (error) {
    // Clean up uploaded file if update fails
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    res.status(500).json({ message: error.message });
  }
};

// Delete report
export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      patientId: req.user._id // Restore patient check for security
    });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Delete the file from storage
    if (report.fileUrl) {
      await fs.unlink(report.fileUrl).catch(console.error);
    }

    await report.deleteOne();
    res.status(200).json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download report file
export const downloadReport = async (req, res) => {
  try {
    // Find the report by ID. Authorization should ideally check if the doctor
    // is associated with the patient, but for now, we allow download by ID.
    const report = await Report.findOne({
      _id: req.params.id
      // Removed patientId check: patientId: req.user._id 
    });
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    if (!report.fileUrl) {
      return res.status(404).json({ message: 'No file available for this report' });
    }
    
    // Get the absolute file path
    const filePath = path.resolve(report.fileUrl);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ message: 'File not found on server' });
    }
    
    // Set appropriate headers for file download
    const fileName = path.basename(filePath);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', report.fileType);
    
    // Stream the file to the response
    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading report file:', error);
    res.status(500).json({ message: error.message || 'Failed to download file' });
  }
};