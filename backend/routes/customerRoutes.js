const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const customerController = require('../controllers/customerController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', customerController.getCustomerList);
router.get('/search', customerController.searchCustomers);
router.get('/template/download', requireRole(['admin', 'reviewer']), customerController.downloadTemplate);
router.get('/:id', customerController.getCustomerById);

router.post('/', requireRole(['admin', 'reviewer']), customerController.createCustomer);
router.post('/import', requireRole(['admin', 'reviewer']), upload.single('file'), customerController.importCustomers);
router.post('/export/excel', requireRole(['admin', 'reviewer']), customerController.exportCustomers);
router.post('/batch-delete', requireRole(['admin', 'reviewer']), customerController.batchDeleteCustomers);

router.put('/:id', requireRole(['admin', 'reviewer']), customerController.updateCustomer);
router.delete('/:id', requireRole(['admin']), customerController.deleteCustomer);

module.exports = router;
