const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const getConnection = require('../../db/oracle');

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

// GET /api/materials - Paginated fetch from Oracle DB
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const { type, page = 1, limit = 5 } = req.query;
        
        let query = 'SELECT * FROM materials';
        const binds = {};
        
        if (type) {
            query += ' WHERE type = :type';
            binds.type = type;
        }
        
        query += ' ORDER BY created_at DESC';
        
        const result = await connection.execute(query, binds);
        const materials = result.rows.map(row => ({
            id: row.ID,
            title: row.TITLE,
            description: row.DESCRIPTION,
            type: row.TYPE,
            format: row.FORMAT,
            filePath: row.FILE_PATH,
            link: row.LINK,
            thumbnail: row.THUMBNAIL,
            downloadCount: row.DOWNLOAD_COUNT || 0,
            createdAt: row.CREATED_AT
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
    } finally {
        if (connection) await connection.close();
    }
});

// POST /api/materials - Upload material to Oracle DB
router.post('/', upload.single('file'), async (req, res) => {
    let connection;
    try {
        const { title, description, link, type: manualType } = req.body;
        const file = req.file;
        
        if (!title) return res.status(400).json({ error: 'Title is required' });
        if (!file && !link) return res.status(400).json({ error: 'Either file or link is required' });
        
        const { type, format } = manualType ? 
            { type: manualType, format: file ? path.extname(file.originalname).slice(1) : 'link' } :
            detectTypeAndFormat(file, link);
        
        const id = uuidv4();
        const filePath = file ? `/uploads/${type === 'textbook' ? 'textbooks' : type === 'video' ? 'videos' : type === 'audio' ? 'audio' : 'notes'}/${file.filename}` : null;
        
        connection = await getConnection();
        await connection.execute(
            `INSERT INTO materials (id, title, description, type, format, file_path, link, thumbnail, download_count, created_at)
             VALUES (:id, :title, :description, :type, :format, :filePath, :link, :thumbnail, :downloadCount, CURRENT_TIMESTAMP)`,
            {
                id,
                title: title.trim(),
                description: (description || '').trim(),
                type,
                format,
                filePath,
                link: link || null,
                thumbnail: null,
                downloadCount: 0
            },
            { autoCommit: true }
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
            createdAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message || 'Failed to upload material' });
    } finally {
        if (connection) await connection.close();
    }
});

// POST /api/materials/:id/download - Increment download count in Oracle DB
router.post('/:id/download', async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        
        connection = await getConnection();
        await connection.execute(
            'UPDATE materials SET download_count = download_count + 1 WHERE id = :id',
            { id },
            { autoCommit: true }
        );
        
        const result = await connection.execute(
            'SELECT download_count FROM materials WHERE id = :id',
            { id }
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Material not found' });
        }
        
        res.json({ downloadCount: result.rows[0].DOWNLOAD_COUNT });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to update download count' });
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;
