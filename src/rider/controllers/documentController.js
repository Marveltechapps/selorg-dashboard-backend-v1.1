const documentService = require('../services/documentService');

const listDocuments = async (req, res, next) => {
  try {
    const { status, riderId, documentType, page, limit } = req.query;
    const result = await documentService.listDocuments(
      { status, riderId, documentType },
      { page, limit }
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getDocumentDetails = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const document = await documentService.getDocumentDetails(documentId);
    res.status(200).json(document);
  } catch (error) {
    next(error);
  }
};

const reviewDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const reviewData = req.body;
    const result = await documentService.reviewDocument(documentId, reviewData);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getDocumentRejectionReason = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const result = await documentService.getDocumentRejectionReason(documentId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getDocumentHistory = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const result = await documentService.getDocumentHistory(documentId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listDocuments,
  getDocumentDetails,
  reviewDocument,
  getDocumentRejectionReason,
  getDocumentHistory,
};
