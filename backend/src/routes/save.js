const express = require('express');
const router = express.Router();
const SaveService = require('../services/saveService');
const { authRequired } = require('../middleware/auth');

// GET /api/v1/save
router.get('/', authRequired, async (req, res) => {
    try {
        const save = await SaveService.getSave(req.user.id);
        if (!save) {
            return res.json({ exists: false });
        }
        res.json({
            exists: true,
            saveData: save.save_data,
            version: save.version,
            savedAt: save.saved_at
        });
    } catch (err) {
        res.status(500).json({ error: 'セーブデータの取得に失敗しました' });
    }
});

// PUT /api/v1/save
router.put('/', authRequired, async (req, res) => {
    try {
        const { saveData, version } = req.body;
        if (!saveData) {
            return res.status(400).json({ error: 'セーブデータが必要です' });
        }
        const result = await SaveService.putSave(req.user.id, saveData, version);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'セーブデータの保存に失敗しました' });
    }
});

module.exports = router;
