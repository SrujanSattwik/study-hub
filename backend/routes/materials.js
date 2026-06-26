const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/postgres');

const UPLOADS_DIR = path.join(__dirname, '../uploads');

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const type = req.body.type || 'notes';
        const typeMap = { textbook: 'textbooks', video: 'videos', audio: 'audio', notes: 'notes' };
        const folder = typeMap[type] || 'notes';
        cb(null, path.join(UPLOADS_DIR, folder));
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedExts = ['.pdf', '.mp4', '.mp3', '.avi', '.mov', '.wav', '.m4a', '.jpg', '.png'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedExts.includes(ext)) cb(null, true);
        else cb(new Error('Invalid file type'));
    }
});

// Auto-detect type and format
const detectTypeAndFormat = (file, link) => {
    if (file) {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.pdf') return { type: 'textbook', format: 'pdf' };
        if (['.mp4', '.avi', '.mov'].includes(ext)) return { type: 'video', format: ext.slice(1) };
        if (['.mp3', '.wav', '.m4a'].includes(ext)) return { type: 'audio', format: ext.slice(1) };
        return { type: 'notes', format: ext.slice(1) };
    }
    if (link) {
        if (link.includes('youtube.com') || link.includes('youtu.be')) return { type: 'video', format: 'link' };
        if (link.includes('soundcloud') || link.includes('spotify')) return { type: 'audio', format: 'link' };
        return { type: 'notes', format: 'link' };
    }
    return { type: 'notes', format: 'link' };
};

// GET /api/materials - Paginated fetch from PostgreSQL DB
router.get('/', async (req, res) => {
    try {
        const { type, page = 1, limit = 5, user_id } = req.query;
        
        let queryStr = 'SELECT * FROM materials';
        const binds = [];
        const conditions = [];
        
        if (type) {
            conditions.push(`type = $${binds.length + 1}`);
            binds.push(type);
        }
        
        if (user_id) {
            conditions.push(`user_id = $${binds.length + 1}`);
            binds.push(user_id);
        }
        
        if (conditions.length > 0) {
            queryStr += ' WHERE ' + conditions.join(' AND ');
        }
        
        queryStr += ' ORDER BY created_at DESC';
        
        const result = await db.query(queryStr, binds);
        const materials = result.rows.map(row => ({
            id: row.id,
            title: row.title,
            description: row.description,
            type: row.type,
            format: row.format,
            filePath: row.file_path,
            link: row.link,
            thumbnail: row.thumbnail,
            downloadCount: row.download_count || 0,
            author: row.author || 'Anonymous',
            createdAt: row.created_at,
            subject: row.subject,
            difficulty: row.difficulty
        }));
        
        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginatedMaterials = materials.slice(startIndex, endIndex);
        
        res.json({
            page: pageNum,
            totalPages: Math.ceil(materials.length / limitNum),
            totalItems: materials.length,
            materials: paginatedMaterials
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to fetch materials' });
    }
});

// POST /api/materials - Upload material to PostgreSQL DB
router.post('/', upload.single('file'), async (req, res) => {
    try {
        console.log('📥 Received request body:', req.body);
        const { title, description, link, type: manualType, author, subject, difficulty } = req.body;
        const file = req.file;
        console.log('👤 Author value:', author);
        
        if (!title) return res.status(400).json({ error: 'Title is required' });
        if (!file && !link) return res.status(400).json({ error: 'Either file or link is required' });
        
        const { type, format } = manualType ? 
            { type: manualType, format: file ? path.extname(file.originalname).slice(1) : 'link' } :
            detectTypeAndFormat(file, link);
        
        const id = uuidv4();
        const filePath = file ? `/uploads/${type === 'textbook' ? 'textbooks' : type === 'video' ? 'videos' : type === 'audio' ? 'audio' : 'notes'}/${file.filename}` : null;
        
        await db.query(
            `INSERT INTO materials (id, title, description, type, format, file_path, link, thumbnail, download_count, created_at, author, user_id, subject, difficulty)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, $10, $11, $12, $13)`,
            [
                id,
                title.trim(),
                (description || '').trim(),
                type,
                format,
                filePath,
                link || null,
                null,
                0,
                (author || 'Anonymous').trim(),
                req.user.user_id,
                subject || null,
                difficulty || null
            ]
        );
        
        res.status(201).json({
            id,
            title: title.trim(),
            description: (description || '').trim(),
            type,
            format,
            filePath,
            link: link || null,
            thumbnail: null,
            downloadCount: 0,
            author: (author || 'Anonymous').trim(),
            createdAt: new Date().toISOString(),
            subject: subject || null,
            difficulty: difficulty || null
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message || 'Failed to upload material' });
    }
});

// POST /api/materials/:id/download - Increment download count in PostgreSQL DB
router.post('/:id/download', async (req, res) => {
    try {
        const { id } = req.params;
        
        await db.query(
            'UPDATE materials SET download_count = download_count + 1 WHERE id = $1',
            [id]
        );
        
        const result = await db.query(
            'SELECT download_count FROM materials WHERE id = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Material not found' });
        }
        
        res.json({ downloadCount: result.rows[0].download_count });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to update download count' });
    }
});

module.exports = router;
