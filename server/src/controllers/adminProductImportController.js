import {
  generateProductImportTemplate,
  validateProductImportWorkbook,
  executeProductImport,
  generateErrorReportExcel,
} from '../services/productImportService.js';

/**
 * Downloads the official multi-sheet Excel workbook template.
 */
export async function downloadTemplate(_req, res) {
  try {
    const buffer = await generateProductImportTemplate();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Amoga_Bulk_Product_Import_Template.xlsx"'
    );
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    return res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    console.error('[ADMIN IMPORT TEMPLATE ERROR]:', err);
    return res.status(500).json({
      error: 'TEMPLATE_GENERATION_FAILED',
      message: 'Failed to generate Excel template: ' + err.message,
    });
  }
}

/**
 * Validates an uploaded Excel workbook against the schema and database constraints.
 */
export async function validateWorkbook(req, res) {
  try {
    const { fileData, mode = 'CREATE_NEW', selectedCollection = 'all' } = req.body;

    if (!fileData || typeof fileData !== 'string') {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Base64 encoded fileData string is required.',
      });
    }

    // Clean data URL prefix if present (e.g. data:application/vnd.openxmlformats...;base64,...)
    const cleanBase64 = fileData.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    if (buffer.length === 0) {
      return res.status(400).json({
        error: 'EMPTY_FILE',
        message: 'The uploaded file buffer is empty.',
      });
    }

    const validationResult = await validateProductImportWorkbook(buffer, {
      mode,
      selectedCollection,
    });

    return res.status(200).json({
      success: true,
      ...validationResult,
    });
  } catch (err) {
    console.error('[ADMIN IMPORT VALIDATE ERROR]:', err);
    return res.status(500).json({
      error: 'VALIDATION_FAILED',
      message: 'Failed to parse and validate Excel workbook: ' + err.message,
    });
  }
}

/**
 * Executes the bulk import transactionally after validation.
 */
export async function executeImport(req, res) {
  try {
    const { validationResult, fileData, mode = 'CREATE_NEW', selectedCollection = 'all' } = req.body;

    let targetValidation = validationResult;

    // If full workbook base64 is re-sent without prior validation result, validate first
    if (!targetValidation && fileData) {
      const cleanBase64 = fileData.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      targetValidation = await validateProductImportWorkbook(buffer, {
        mode,
        selectedCollection,
      });
    }

    if (!targetValidation) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Validated product data or workbook fileData is required to execute import.',
      });
    }

    if (!targetValidation.valid && (!targetValidation.parsedProducts?.length && !targetValidation.parsedInventory?.length)) {
      return res.status(400).json({
        error: 'VALIDATION_ERRORS_EXIST',
        message: 'Cannot import a workbook with blocking validation errors. Please review errors first.',
        errors: targetValidation.errors,
      });
    }

    const importSummary = await executeProductImport(
      targetValidation,
      { mode },
      req.admin
    );

    return res.status(201).json({
      success: true,
      ...importSummary,
    });
  } catch (err) {
    console.error('[ADMIN IMPORT EXECUTE ERROR]:', err);
    return res.status(500).json({
      error: 'IMPORT_EXECUTION_FAILED',
      message: 'Failed to execute bulk product import: ' + err.message,
    });
  }
}

/**
 * Generates and downloads an Excel error report workbook.
 */
export async function downloadErrorReport(req, res) {
  try {
    const { errors = [], warnings = [] } = req.body;

    const buffer = await generateErrorReportExcel(errors, warnings);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Amoga_Import_Validation_Errors.xlsx"'
    );

    return res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    console.error('[ADMIN ERROR REPORT DOWNLOAD ERROR]:', err);
    return res.status(500).json({
      error: 'ERROR_REPORT_FAILED',
      message: 'Failed to generate error report: ' + err.message,
    });
  }
}
