const Category = require('../models/Category');

const DEFAULT_CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Groceries',
  'Online Shopping',
  'Transport',
  'Shopping',
  'Bills',
  'Other',
];

const normalizeCategoryName = (name) => String(name || '').trim();

const getCategories = async (req, res, next) => {
  try {
    const userCategories = await Category.find({ userId: req.user.id }).sort({ name: 1 });
    const customNames = userCategories.map((category) => category.name);
    const names = [...new Set([...DEFAULT_CATEGORIES, ...customNames])].sort((a, b) => a.localeCompare(b));

    res.status(200).json({
      success: true,
      count: names.length,
      data: names,
    });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const name = normalizeCategoryName(req.body.name);

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const existing = await Category.findOne({
      userId: req.user.id,
      name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    });

    if (existing || DEFAULT_CATEGORIES.some((category) => category.toLowerCase() === name.toLowerCase())) {
      return res.status(200).json({
        success: true,
        data: existing ? existing.name : DEFAULT_CATEGORIES.find((category) => category.toLowerCase() === name.toLowerCase()),
      });
    }

    const category = await Category.create({ userId: req.user.id, name });

    res.status(201).json({
      success: true,
      data: category.name,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
};
