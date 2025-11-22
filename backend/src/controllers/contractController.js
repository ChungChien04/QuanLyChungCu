// /backend/src/controllers/contractController.js
const Contract = require('../models/contractModel');

// Khách hàng / Cư dân: đề nghị ký hợp đồng (UC8)
// (Tuỳ mô hình, bạn có thể cho residente tự tạo "draft", Admin duyệt sau)
exports.requestContract = async (req, res) => {
  try {
    const { apartment, startDate, endDate, monthlyRent, deposit } = req.body;

    if (!apartment || !startDate || !endDate || !monthlyRent) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc cho hợp đồng.' });
    }

    const contract = await Contract.create({
      tenant: req.user._id,
      apartment,
      startDate,
      endDate,
      monthlyRent,
      deposit,
      status: 'draft',
    });

    res.status(201).json(contract);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi tạo hợp đồng.' });
  }
};

// Cư dân: xem các hợp đồng của mình (UC9 – góc nhìn cư dân)
exports.getMyContracts = async (req, res) => {
  try {
    const contracts = await Contract.find({ tenant: req.user._id })
      .populate('apartment')
      .sort({ createdAt: -1 });

    res.json(contracts);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách hợp đồng.' });
  }
};

// Admin: xem tất cả hợp đồng (UC9 – quản lý)
exports.getAllContracts = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const contracts = await Contract.find(filter)
      .populate('tenant', 'name email')
      .populate('apartment')
      .sort({ createdAt: -1 });

    res.json(contracts);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách hợp đồng.' });
  }
};

// Admin: cập nhật trạng thái hợp đồng (active/terminated/expired...)
exports.updateContractStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      return res.status(404).json({ message: 'Không tìm thấy hợp đồng.' });
    }

    contract.status = status || contract.status;
    if (status === 'active' && !contract.signedAt) {
      contract.signedAt = new Date();
      contract.signedBy = req.user._id;
    }

    const updated = await contract.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi cập nhật hợp đồng.' });
  }
};
