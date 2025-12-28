const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const customerController = require('../controllers/customerController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', customerController.getCustomerList);
router.get('/search', customerController.searchCustomers);
router.get('/template/download', customerController.downloadTemplate);
router.get('/:id', customerController.getCustomerById);

router.post('/', requireRole(['admin', 'purchaser', 'salesperson']), customerController.createCustomer);
router.post('/import', requireRole(['admin', 'purchaser']), upload.single('file'), customerController.importCustomers);
router.post('/export/excel', customerController.exportCustomers);
router.post('/batch-delete', requireRole(['admin']), customerController.batchDeleteCustomers);

router.put('/:id', requireRole(['admin', 'purchaser', 'salesperson']), customerController.updateCustomer);
router.delete('/:id', requireRole(['admin']), customerController.deleteCustomer);

module.exports = router;
