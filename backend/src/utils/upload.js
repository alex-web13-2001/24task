import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Разрешенные типы файлов
const ALLOWED_MIMETYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'image/png',
  'image/jpeg',
  'application/zip'
];

// Создание директорий для загрузки, если они не существуют
const ensureUploadDirs = () => {
  const dirs = [
    path.join(__dirname, '../uploads/projects'),
    path.join(__dirname, '../uploads/tasks'),
    path.join(__dirname, '../uploads/avatars')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

ensureUploadDirs();

// Конфигурация хранилища для проектов
const projectStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/projects'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Конфигурация хранилища для задач
const taskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/tasks'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Конфигурация хранилища для аватаров
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/avatars'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  }
});

// Фильтр файлов
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Недопустимый тип файла. Разрешены: PDF, DOCX, XLSX, PNG, JPG, ZIP'), false);
  }
};

// Фильтр для аватаров (только изображения)
const avatarFilter = (req, file, cb) => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Недопустимый тип файла. Разрешены: PNG, JPG, WEBP'), false);
  }
};

// Middleware для загрузки файлов проекта
export const uploadProjectFiles = multer({
  storage: projectStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600, // 100 MB
    files: parseInt(process.env.MAX_FILES_PER_PROJECT) || 10
  }
}).array('files', 10);

// Middleware для загрузки файлов задачи
export const uploadTaskFiles = multer({
  storage: taskStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600, // 100 MB
    files: parseInt(process.env.MAX_FILES_PER_TASK) || 5
  }
}).array('files', 5);

// Middleware для загрузки аватара
export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  }
}).single('avatar');

// Функция для удаления файла
export const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Файл удален: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Ошибка удаления файла: ${error.message}`);
  }
};
