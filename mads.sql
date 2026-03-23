-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Mar 23, 2026 at 03:55 PM
-- Server version: 11.8.3-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u688635524_mads`
--

-- --------------------------------------------------------

--
-- Table structure for table `agendas`
--

CREATE TABLE `agendas` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `event_date` date NOT NULL,
  `event_time` varchar(50) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `status` enum('Draft','Publish') NOT NULL DEFAULT 'Draft',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `agendas`
--

INSERT INTO `agendas` (`id`, `title`, `description`, `event_date`, `event_time`, `location`, `status`, `created_at`) VALUES
(1, 'ASAT 2026', '<ul><li>Pelaksanaan Asesmen Sumatif Akhir Tahun Semester Genap TP. 2025/2026 untuk kelas XII</li></ul>', '2026-02-23', '07:30', 'MA Darussalam Cilongok', 'Publish', '2026-03-11 17:41:31'),
(2, 'ASTS GENAP 2026', '<ul><li>Pelaksanaan Asesmen Sumatif Tengah Semester Genap TP. 2025/2026 untuk kelas X dan XI</li></ul>', '2026-03-04', '07:30', 'MA Darussalam CIlongok', 'Publish', '2026-03-12 17:07:35');

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `author` varchar(100) NOT NULL,
  `status` enum('Draft','Publish') NOT NULL DEFAULT 'Draft',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `announcements`
--

INSERT INTO `announcements` (`id`, `title`, `content`, `author`, `status`, `created_at`) VALUES
(1, 'LIBUR HARI RAYA IDUL FITRI 2026', '<ul><li>Libur lebaran idul fitri 2026 akan dimulai dari tanggal 11 Maret - 15 April 2026</li></ul>', 'Admin', 'Publish', '2026-03-11 17:43:12');

-- --------------------------------------------------------

--
-- Table structure for table `comments`
--

CREATE TABLE `comments` (
  `id` int(11) NOT NULL,
  `post_id` int(11) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `author_name` varchar(255) NOT NULL,
  `author_email` varchar(255) DEFAULT NULL,
  `author_url` varchar(255) DEFAULT NULL,
  `content` text NOT NULL,
  `status` enum('pending','approved','spam','trash') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `data_modules`
--

CREATE TABLE `data_modules` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `display_type` varchar(20) NOT NULL DEFAULT 'table',
  `grid_columns` int(11) NOT NULL DEFAULT 3,
  `sort_field` varchar(255) DEFAULT NULL,
  `sort_direction` enum('asc','desc') NOT NULL DEFAULT 'asc'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `data_module_fields`
--

CREATE TABLE `data_module_fields` (
  `id` int(11) NOT NULL,
  `module_id` int(11) NOT NULL,
  `label` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` varchar(50) NOT NULL,
  `required` tinyint(1) DEFAULT 0,
  `options` text DEFAULT NULL,
  `order_index` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `data_module_rows`
--

CREATE TABLE `data_module_rows` (
  `id` int(11) NOT NULL,
  `module_id` int(11) NOT NULL,
  `data` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

CREATE TABLE `documents` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `type` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `documents`
--

INSERT INTO `documents` (`id`, `name`, `file_path`, `type`, `created_at`) VALUES
(1, 'SK Kaldik TA. 2025/2026', '../uploads/documents/69b2f89b206e7_SK_KALDIK_25-26.pdf', 'pdf', '2026-03-12 17:32:11');

-- --------------------------------------------------------

--
-- Table structure for table `ekskul`
--

CREATE TABLE `ekskul` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `status` enum('Draft','Publish') NOT NULL DEFAULT 'Draft',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `coach` varchar(255) DEFAULT NULL,
  `schedule` varchar(255) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ekskul`
--

INSERT INTO `ekskul` (`id`, `name`, `description`, `image_url`, `status`, `created_at`, `coach`, `schedule`, `category`) VALUES
(1, 'Pramuka', 'Ekskul Pramuka di Madrasah Aliyah (MA) adalah pendidikan kepanduan berbasis karakter (Penegak) yang menekankan kemandirian, kedisiplinan, kepemimpinan, dan akhlak mulia sesuai nilai Islam. Kegiatan meliputi latihan rutin (tali-temali, sandi, baris-berbaris), perkemahan, survival, serta pengabdian masyarakat untuk membentuk anggota yang tangguh, aktif, dan kreatif.', 'https://madarussalamcilongok.sch.id/uploads/69b1fd528a25c_Pramuka.jpeg', 'Publish', '2026-03-11 17:44:08', 'Umi Latifah, S.Pd', 'Jumat 14.00 - 16.00', 'Kepemimpinan'),
(2, 'FUTSAL', 'Kegiatan ini merupakan bagian dari program pengembangan diri yang disediakan madrasah untuk memastikan siswa mendapatkan pendidikan holistik.', 'https://madarussalamcilongok.sch.id/uploads/69b30c5c742c6_1773341111261.jpg', 'Publish', '2026-03-12 18:35:35', 'Imam Anggrianto, S.HI', 'Kamis 14.00 - 16.00', 'Olahraga');

-- --------------------------------------------------------

--
-- Table structure for table `facilities`
--

CREATE TABLE `facilities` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `facilities`
--

INSERT INTO `facilities` (`id`, `name`, `description`, `image`, `created_at`) VALUES
(1, 'Gedung Utama', 'Mencakup Ruang Kepala, Guru, dan TU serta Ruang Kelas X, XI, dan XII juga Ruang Lab IT dan Lab IPA', 'https://madarussalamcilongok.sch.id/uploads/69b2f81142479_IMG_20260119_161930.jpg', '2026-03-12 17:30:20');

-- --------------------------------------------------------

--
-- Table structure for table `form_submissions`
--

CREATE TABLE `form_submissions` (
  `id` int(11) NOT NULL,
  `page_id` int(11) NOT NULL,
  `data` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gurus`
--

CREATE TABLE `gurus` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `gurus`
--

INSERT INTO `gurus` (`id`, `name`, `role`, `image_url`, `created_at`) VALUES
(1, 'Wiken Yuliati, S.Si', 'Guru Fisika dan Kimia', 'https://madarussalamcilongok.sch.id/uploads/69b1e96812f2f_girl.jpg', '2026-03-11 22:15:10'),
(2, 'Wahyu Ana F., S.E, M.Pd', 'Guru Matematika', 'https://madarussalamcilongok.sch.id/uploads/69b1e96812f2f_girl.jpg', '2026-03-11 22:41:00'),
(3, 'Umi Latifah, S.Pd', 'Guru B. Indonesia', 'https://madarussalamcilongok.sch.id/uploads/69b1e96812f2f_girl.jpg', '2026-03-12 10:36:18'),
(4, 'Teguh Arif F., S.Pd', 'Guru SKI dan Sejarah', 'https://madarussalamcilongok.sch.id/uploads/69b1e84de9713_man.jpg', '2026-03-12 10:36:51'),
(5, 'Novia Nur H., S.Pd, M.Pd', 'Guru Biologi', 'https://madarussalamcilongok.sch.id/uploads/69b1e96812f2f_girl.jpg', '2026-03-12 10:37:18'),
(6, 'Mufid Marzuki, S.Pd', 'Guru Akidah Akhlak dan Geografi', 'https://madarussalamcilongok.sch.id/uploads/69b1e84de9713_man.jpg', '2026-03-12 10:37:53'),
(7, 'Khoirul Anam, S.E.Sy, M.Pd', 'Guru Fikih dan Ekonomi', 'https://madarussalamcilongok.sch.id/uploads/69b1e84de9713_man.jpg', '2026-03-12 10:38:43'),
(8, 'Ivka Sulis S., S.E.Sy, M.Pd', 'Guru Matematika', 'https://madarussalamcilongok.sch.id/uploads/69b1e96812f2f_girl.jpg', '2026-03-12 10:39:14'),
(9, 'Isna Fitriatun, S.Pd', 'Guru B. Inggris', 'https://madarussalamcilongok.sch.id/uploads/69b1e96812f2f_girl.jpg', '2026-03-12 10:39:34'),
(10, 'Imam Anggrianto, SHI.', 'Guru Fikih dan Sosiologi', 'https://madarussalamcilongok.sch.id/uploads/69b1e84de9713_man.jpg', '2026-03-12 10:40:03'),
(11, 'Hadiyanto, S.Pd', 'Guru Seni Budaya', 'https://madarussalamcilongok.sch.id/uploads/69b1e84de9713_man.jpg', '2026-03-12 10:40:22'),
(12, 'Agus Suparmo, A.Ma', 'Guru B. Jawa', 'https://madarussalamcilongok.sch.id/uploads/69b1e84de9713_man.jpg', '2026-03-12 10:40:40'),
(13, 'Achmad Darojat, S.Pd', 'Guru PKN', 'https://madarussalamcilongok.sch.id/uploads/69b1e84de9713_man.jpg', '2026-03-12 10:40:59'),
(14, 'Achmad Rois A., S.Pd, M.Pd', 'Guru Qur&#039;an Hadis', 'https://madarussalamcilongok.sch.id/uploads/69b1e84de9713_man.jpg', '2026-03-12 10:41:25');

-- --------------------------------------------------------

--
-- Table structure for table `media`
--

CREATE TABLE `media` (
  `id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_type` enum('image','document') NOT NULL,
  `file_url` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `media`
--

INSERT INTO `media` (`id`, `file_name`, `file_type`, `file_url`, `created_at`) VALUES
(7, 'LogoMA150px.png', 'image', 'https://madarussalamcilongok.sch.id/uploads/69b173e3e0767_LogoMA150px.png', '2026-03-11 13:53:40'),
(8, 'man.jpg', 'image', 'https://madarussalamcilongok.sch.id/uploads/69b1e84de9713_man.jpg', '2026-03-11 22:10:24'),
(10, 'girl.jpg', 'image', 'https://madarussalamcilongok.sch.id/uploads/69b1e96812f2f_girl.jpg', '2026-03-11 22:15:06'),
(11, 'Paskibra.jpeg', 'image', 'https://madarussalamcilongok.sch.id/uploads/69b1fd435e098_Paskibra.jpeg', '2026-03-11 23:39:48'),
(12, 'Pramuka.jpeg', 'image', 'https://madarussalamcilongok.sch.id/uploads/69b1fd528a25c_Pramuka.jpeg', '2026-03-11 23:40:03'),
(13, 'IMG_20260119_161930.jpg', 'image', 'https://madarussalamcilongok.sch.id/uploads/69b2f81142479_IMG_20260119_161930.jpg', '2026-03-12 17:30:11'),
(14, 'ahmadpanusupan3x4.jpg', 'image', 'https://madarussalamcilongok.sch.id/uploads/69b304e58e691_ahmadpanusupan3x4.jpg', '2026-03-12 18:24:37'),
(15, 'PP.png', 'image', 'https://madarussalamcilongok.sch.id/uploads/69b305851da4f_PP.png', '2026-03-12 18:27:17'),
(16, '1773341111261.jpg', 'image', 'https://madarussalamcilongok.sch.id/uploads/69b30c5c742c6_1773341111261.jpg', '2026-03-12 18:56:29');

-- --------------------------------------------------------

--
-- Table structure for table `pages`
--

CREATE TABLE `pages` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `author` varchar(100) NOT NULL,
  `template` varchar(50) DEFAULT 'default',
  `litespeed_cache` tinyint(1) DEFAULT 1,
  `breadcrumbs` enum('inherit','enable','disable') DEFAULT 'inherit',
  `status` enum('Draft','Publish') NOT NULL DEFAULT 'Draft',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `page_type` enum('static','form') NOT NULL DEFAULT 'static',
  `form_schema` text DEFAULT NULL,
  `data_module_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pages`
--

INSERT INTO `pages` (`id`, `title`, `slug`, `content`, `author`, `template`, `litespeed_cache`, `breadcrumbs`, `status`, `created_at`, `page_type`, `form_schema`, `data_module_id`) VALUES
(1, 'Pustaka Dokumen', 'file', '{\"ROOT\":{\"type\":{\"resolvedName\":\"Container\"},\"isCanvas\":true,\"props\":{\"background\":\"bg-white\",\"padding\":0},\"displayName\":\"Container\",\"custom\":{},\"hidden\":false,\"nodes\":[\"0xy-a8Lzbr\"],\"linkedNodes\":{}},\"0xy-a8Lzbr\":{\"type\":{\"resolvedName\":\"FilesBlock\"},\"isCanvas\":false,\"props\":{},\"displayName\":\"Ny\",\"custom\":{},\"parent\":\"ROOT\",\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}}}', 'Admin', 'default', 0, 'inherit', 'Publish', '2026-03-11 16:44:15', 'static', NULL, NULL),
(2, 'Fasilitas', 'fasilitas', '{\"ROOT\":{\"type\":{\"resolvedName\":\"Container\"},\"isCanvas\":true,\"props\":{\"background\":\"bg-white\",\"padding\":0},\"displayName\":\"Container\",\"custom\":{},\"hidden\":false,\"nodes\":[\"JmTOmmmcNy\"],\"linkedNodes\":{}},\"JmTOmmmcNy\":{\"type\":{\"resolvedName\":\"FacilityBlock\"},\"isCanvas\":false,\"props\":{},\"displayName\":\"wy\",\"custom\":{},\"parent\":\"ROOT\",\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}}}', 'Admin', 'default', 0, 'inherit', 'Publish', '2026-03-11 16:47:07', 'static', NULL, NULL),
(3, 'Daftar Guru &amp; Staff', 'guru', '{\"ROOT\":{\"type\":{\"resolvedName\":\"Container\"},\"isCanvas\":true,\"props\":{\"background\":\"bg-white\",\"padding\":0},\"displayName\":\"Container\",\"custom\":{},\"hidden\":false,\"nodes\":[\"6JS2SQAyHv\"],\"linkedNodes\":{}},\"6JS2SQAyHv\":{\"type\":{\"resolvedName\":\"GuruBlock\"},\"isCanvas\":false,\"props\":{\"title\":\"Mereka Para Guru dan Staff Kami yang Professional\"},\"displayName\":\"Daftar Guru\",\"custom\":{},\"parent\":\"ROOT\",\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}}}', 'Admin', 'default', 0, 'inherit', 'Publish', '2026-03-11 16:54:11', 'static', NULL, NULL),
(4, 'Visi Misi', 'visimisi', '{\"ROOT\":{\"type\":{\"resolvedName\":\"Container\"},\"isCanvas\":true,\"props\":{\"background\":\"bg-white\",\"padding\":24},\"displayName\":\"Container\",\"custom\":{},\"hidden\":false,\"nodes\":[\"GLgnlwCAes\",\"q0_r_qauDU\",\"iqLDKknzGv\",\"Zer39uxJmz\",\"23p3rB9Lpe\"],\"linkedNodes\":{}},\"GLgnlwCAes\":{\"type\":{\"resolvedName\":\"Text\"},\"isCanvas\":false,\"props\":{\"text\":\"VISI\",\"fontSize\":24,\"color\":\"#096e02\",\"align\":\"left\",\"style\":\"heading\"},\"displayName\":\"Text\",\"custom\":{},\"parent\":\"ROOT\",\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}},\"q0_r_qauDU\":{\"type\":{\"resolvedName\":\"RichTextBlock\"},\"isCanvas\":false,\"props\":{\"content\":\"<p><em>“TERWUJUDNYA PESERTA DIDIK YANG BERTAQWA, KREATIF, BERKARAKTER DAN BERWAWASAN LINGKUNGAN”</em></p>\",\"minHeight\":120,\"background\":\"#f3f4f6\",\"padding\":16},\"displayName\":\"Rich Text\",\"custom\":{},\"parent\":\"ROOT\",\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}},\"Zer39uxJmz\":{\"type\":{\"resolvedName\":\"Text\"},\"isCanvas\":false,\"props\":{\"text\":\"MISI\",\"fontSize\":24,\"color\":\"#096e02\",\"align\":\"left\",\"style\":\"heading\"},\"displayName\":\"Text\",\"custom\":{},\"parent\":\"ROOT\",\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}},\"23p3rB9Lpe\":{\"type\":{\"resolvedName\":\"RichTextBlock\"},\"isCanvas\":false,\"props\":{\"content\":\"<ol><li>Membiasakan peserta didik untuk melaksanakan ibadah wajib dan sunah sesuai ajaran Islam menurut paham Ahlus Sunnah Wal Jama’ah.</li><li>Menyelenggarakan pendidikan yang berlandaskan nilai-nilai keimanan dan ketakwaan kepada Tuhan Yang Maha Esa, melalui pembiasaan sikap religius dan penguatan pendidikan karakter dalam seluruh kegiatan sekolah.</li><li>Melaksanakan pembelajaran yang berpusat pada peserta didik, dengan pendekatan diferensiasi dan penguatan kemampuan bernalar kritis serta kreativitas sesuai potensi, minat, dan bakat peserta didik.</li><li>Mengintegrasikan penguatan karakter dan Profil Pelajar Pancasila dalam kegiatan intrakurikuler, kokurikuler, dan ekstrakurikuler secara berkelanjutan.</li><li>Menyelenggarakan pembelajaran dan kegiatan sekolah yang menumbuhkan kepedulian terhadap lingkungan hidup, melalui pendidikan lingkungan, pembiasaan perilaku ramah lingkungan, dan aksi nyata pelestarian lingkungan.</li><li>Menciptakan ekosistem sekolah yang aman, inklusif, tertib, dan kondusif, sebagai lingkungan belajar yang mendukung perkembangan akademik dan non akademik peserta didik.</li><li>Meningkatkan profesionalisme pendidik dan tenaga kependidikan, dalam perencanaan, pelaksanaan, dan evaluasi pembelajaran sesuai dengan prinsip Kurikulum Merdeka.</li><li>Menjalin kemitraan yang efektif dengan orang tua, masyarakat, dan pemangku kepentingan, guna mendukung keberhasilan proses pendidikan dan pembentukan karakter peserta didik.</li></ol>\",\"minHeight\":240,\"background\":\"#f3f4f6\",\"padding\":\"p-4\"},\"displayName\":\"Rich Text\",\"custom\":{},\"parent\":\"ROOT\",\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}},\"iqLDKknzGv\":{\"type\":{\"resolvedName\":\"DividerBlock\"},\"isCanvas\":false,\"props\":{\"color\":\"#f6ab09\",\"thickness\":2,\"width\":\"full\",\"margin\":\"my-6\"},\"displayName\":\"Divider\",\"custom\":{},\"parent\":\"ROOT\",\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}}}', 'Admin', 'narrow', 0, 'inherit', 'Publish', '2026-03-11 17:17:24', 'static', NULL, NULL),
(5, 'Tentang Kami', 'tentang', '{\"ROOT\":{\"type\":{\"resolvedName\":\"Container\"},\"isCanvas\":true,\"props\":{\"background\":\"bg-white\",\"padding\":0},\"displayName\":\"Container\",\"custom\":{},\"hidden\":false,\"nodes\":[\"vZlePUF7ol\"],\"linkedNodes\":{}},\"vZlePUF7ol\":{\"type\":{\"resolvedName\":\"RichTextBlock\"},\"isCanvas\":false,\"props\":{\"content\":\"<p><strong class=\\\"ql-font-serif\\\">MA Darussalam Cilongok</strong><span class=\\\"ql-font-serif\\\"> merupakan lembaga di bawah naungan Yayasan Pendidikan Islam Darussalam Cilongok yang berdiri dari tahun 2020. Berlokasi di Grumbul Kandang Aur RT 04 RW 02 Desa Panusupan Kecamatan Cilongok Kabupaten Banyumas Provinsi Jawa Tengan. Merupakan usulan dari berbagai pihak, baik dari alumni, simpatisan maupun masyarakat sekitar. Pendidik di madrasah kami sebagian besar adalah berlatar belakang pesantren serta lulusan perguruan tinggi dengan tupoksi masing-masih sesuai mapel yang dipegang.</span></p>\",\"minHeight\":240,\"background\":\"#ffffff\",\"padding\":\"p-4\"},\"displayName\":\"Rich Text\",\"custom\":{},\"parent\":\"ROOT\",\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}}}', 'Admin', 'default', 0, 'inherit', 'Publish', '2026-03-11 17:19:35', 'static', NULL, NULL),
(6, 'Sambutan Kepala MA Darussalam Cilongok', 'sambutan', '{\"ROOT\":{\"type\":{\"resolvedName\":\"Container\"},\"isCanvas\":true,\"props\":{\"background\":\"bg-white\",\"padding\":\"p-10\"},\"displayName\":\"Container\",\"custom\":{},\"hidden\":false,\"nodes\":[\"kRLzhc6hx6\",\"rIvFPLD2kN\"],\"linkedNodes\":{}},\"kRLzhc6hx6\":{\"type\":{\"resolvedName\":\"RichTextBlock\"},\"isCanvas\":false,\"props\":{\"content\":\"<p><em>Assalamu’alaikum Warahmatullahi Wabarakatuh,</em></p><p>Selamat datang di official website MA Darussalam Cilongok.</p><p>Segala puji bagi Allah Swt. atas limpahan rahmat dan hidayah-Nya sehingga kita dapat terus melangkah dalam menjalankan amanah mencerdaskan generasi bangsa. Selawat serta salam senantiasa tercurah kepada uswah hasanah kita, Nabi Muhammad Saw.</p><p>Di era digital yang bergerak begitu cepat, kehadiran website ini bukan sekadar mengikuti tren, melainkan sebuah kebutuhan krusial sebagai jendela informasi dan sarana komunikasi antara madrasah, siswa, orang tua, serta masyarakat luas.</p><p>MA Darussalam Cilongok berkomitmen untuk menjadi lembaga pendidikan yang tidak hanya unggul secara akademis, tetapi juga kokoh dalam karakter Islami. Kami percaya bahwa pendidikan yang baik adalah yang mampu menyelaraskan antara Ilmu Pengetahuan dan Teknologi (IPTEK) dengan Iman dan Taqwa (IMTAQ). Melalui program-program unggulan, pembiasaan akhlakul karimah, dan bimbingan guru-guru yang berdedikasi, kami berikhtiar mencetak lulusan yang cerdas, mandiri, dan bermanfaat bagi umat.</p><p>Kami mengajak seluruh civitas akademika untuk terus berinovasi dan bekerja sama demi kemajuan madrasah kita tercinta. Bagi para orang tua dan calon siswa, silakan jelajahi website ini untuk mengenal lebih dalam mengenai program kurikulum, fasilitas, serta berbagai prestasi yang telah diraih oleh putra-putri kami.</p><p>Terima kasih atas kepercayaan Bapak/Ibu sekalian. Mari bersama-sama kita wujudkan generasi emas yang beradab dan berilmu.</p><p><em>Wassalamu’alaikum Warahmatullahi Wabarakatuh.</em></p><p>Kepala MA Darussalam Cilongok,</p><p><strong>Achmad Rois Abdulloh, S.Pd, M.Pd.</strong></p>\",\"minHeight\":240,\"background\":\"#ffffff\",\"padding\":\"p-4\"},\"displayName\":\"Rich Text\",\"custom\":{},\"parent\":\"ROOT\",\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}},\"rIvFPLD2kN\":{\"type\":{\"resolvedName\":\"DividerBlock\"},\"isCanvas\":false,\"props\":{\"color\":\"#e5e7eb\",\"thickness\":1,\"width\":\"full\",\"margin\":\"my-6\"},\"displayName\":\"Divider\",\"custom\":{},\"parent\":\"ROOT\",\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}}}', 'Admin', 'default', 0, 'inherit', 'Publish', '2026-03-12 18:23:17', 'static', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `posts`
--

CREATE TABLE `posts` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `image` text DEFAULT NULL,
  `content` text NOT NULL,
  `author` varchar(100) NOT NULL,
  `category` varchar(100) NOT NULL,
  `status` enum('Draft','Publish') NOT NULL DEFAULT 'Draft',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `posts`
--

INSERT INTO `posts` (`id`, `title`, `image`, `content`, `author`, `category`, `status`, `created_at`) VALUES
(1, 'Achmad Rois: Uji Coba Judul Artikel Yang Panjang', 'https://madarussalamcilongok.sch.id/uploads/69b1fd435e098_Paskibra.jpeg', '<p>percobaan untuk mengetahui fungsi dan render spasi atau sanitize dan normalize html yang tersimpan ke backend apakah sudah sesuai atau belum</p>', 'Admin', 'Berita Utama', 'Publish', '2026-03-11 23:34:06'),
(2, 'Pemilihan Ketua OSIM MA Darussalam Cilongok Berlangsung Sukses dengan Semangat Kebersamaan', '', '<p class=\"ql-align-justify\">Cilongok – <strong>Madrasah Aliyah Darussalam Panusupan Cilongok</strong> telah melaksanakan Pemilihan Ketua Organisasi Siswa Intra Madrasah (OSIM) periode 2026/2027 pada hari Kamis (12/02/2026). Kegiatan yang digelar dengan tema &quot;OSIM sebagai Wadah Pengembangan Potensi dan Penggerak Perubahan Positif&quot; diselenggarakan layaknya pemilihan umum nasional, tanpa menggunakan sistem daring.</p><p class=\"ql-align-justify\"></p><p class=\"ql-align-justify\"><strong>*Proses Pendaftaran dan Seleksi Calon*</strong></p><p class=\"ql-align-justify\">Pendaftaran bakal calon ketua OSIM dilakukan pada tanggal 7 Februari 2026. Kriteria yang ditetapkan meliputi memiliki akhlak mulia, prestasi akademik yang memadai, memiliki kemampuan kepemimpinan, serta memiliki komitmen untuk mengabdi pada madrasah dan sesama siswa. Kandidat ketua OSIM diambil dari siswa/siswi kelas X dan kelas XI.</p><p class=\"ql-align-justify\">Setelah melalui tahap seleksi administrasi, wawancara dengan panitia, dan presentasi konsep kerja awal, terpilih delapan calon ketua OSIM yang siap bersaing, yaitu:</p><ol><li>Maulana Zuhrul Anam (kelas X)</li><li>Muhaimin (Kelas X)</li><li>Dimas Maulana Yusuf (Kelas X)</li><li>Muhammad Alifian Asrof (Kelas X)</li><li>Dewi Nur Hidayah (Kelas XI)</li><li>Fathu Asyrofu Adyan (Kelas XI)</li><li>Fadhil Miftahur Rohman (Kelas XI)</li><li>Fakhri Ubaidillah Shiddiq (Kelas XI)</li></ol><p class=\"ql-align-justify\">Setiap calon telah menyampaikan visi dan misi masing-masing terkait pengembangan OSIM dan kemajuan madrasah kepada seluruh warga madrasah melalui sesi presentasi dan diskusi terbuka sebelum hari pemilihan.</p><p class=\"ql-align-justify\"></p><p class=\"ql-align-justify\"><strong>*Pelaksanaan Pemungutan Suara*</strong></p><p class=\"ql-align-justify\">Pemungutan suara dilakukan secara penuh luring di aula madrasah, diselenggarakan layaknya pemilu dengan penyediaan ruangan suara yang terpisah, petugas pemilihan yang terlatih, serta tata cara yang jelas dan transparan.</p><p class=\"ql-align-justify\">Waktu pemungutan suara dibuka mulai pukul 08.00 hingga 10.00 WIB. Selain siswa siswi MA Darussalam, yaitu Kepala madrasah, guru pembina OSIM, seluruh guru serta karyawan madrasah juga berhak memberikan suara. Panitia juga menyediakan ruang untuk memberikan pemahaman terkait konsep kerja masing-masing calon kepada pemilih sebelum mereka memilih.</p><p class=\"ql-align-justify\"></p><p class=\"ql-align-justify\"><strong>*Hasil Pemilihan dan Penetapan*</strong></p><p class=\"ql-align-justify\">Penghitungan suara dilakukan pada hari yang sama setelah pemungutan suara ditutup, dihadiri oleh Kepala Madrasah, Wakil Kepala Bidang Kesiswaan, Pembina OSIM, dan perwakilan dari Majelis Permusyawaratan Kelas (MPK). Dari total 63 suara yang masuk, 59 suara dinyatakan sah dan 4 suara tidak sah.</p><p class=\"ql-align-justify\">Perolehan suara sebagai berikut:</p><ol><li>Maulana Zuhrul Anam – 5 suara</li><li>Muhaimin – 0 suara</li><li>Dimas Maulana Yusuf – 5 suara</li><li>Muhammad Alifian Asrof – 0 suara</li><li>Dewi Nur Hidayah – 4 suara</li><li>Fathu Asyrofu Adyan – 3 suara</li><li>Fadhil Miftahur Rohman – 14 suara</li><li>Fakhri Ubaidillah Shiddiq – 28 suara</li></ol><p class=\"ql-align-justify\">Berdasarkan hasil tersebut, Fakhri Ubaidillah Shiddiq ditetapkan sebagai Ketua OSIM MA Darussalam Panusupan Cilongok periode 2026/2027. Serah terima jabatan akan dilakukan pada hari Sabtu (14/02/2026) dalam kegiatan khusus yang dihadiri oleh seluruh warga madrasah.</p><p class=\"ql-align-justify\"></p><p class=\"ql-align-justify\"><strong>*Harapan untuk OSIM Masa Depan*</strong></p><p class=\"ql-align-justify\">Kepala Madrasah MA Darussalam Panusupan Cilongok, Gus Achmad Rois Abdulloh, M.Pd., menyampaikan harapannya kepada pengurus OSIM baru. &quot;Semoga dengan kepemimpinan yang baru, OSIM dapat terus berkembang dan menjadi motor penggerak bagi kemajuan madrasah, serta mampu menjadi wadah yang efektif untuk mengembangkan potensi seluruh siswa,&quot; ujarnya.</p><p class=\"ql-align-justify\">Sementara itu, calon ketua OSIM terpilih, Fakhri Ubaidillah Shiddiq, menyampaikan bahwa ia akan bekerja sama dengan seluruh calon lain, pengurus, dan warga madrasah untuk mewujudkan berbagai konsep kerja yang telah diusung, serta mengatasi berbagai tantangan yang ada demi kemajuan bersama.</p>', 'Fadhil Miftahur Rohman', 'Berita Utama', 'Publish', '2026-03-12 17:01:41');

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `logo_url` varchar(255) NOT NULL,
  `favicon_url` varchar(255) DEFAULT NULL,
  `phone` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `address` text DEFAULT NULL,
  `social_fb` varchar(255) DEFAULT NULL,
  `social_tw` varchar(255) DEFAULT NULL,
  `social_ig` varchar(255) DEFAULT NULL,
  `social_yt` varchar(255) DEFAULT NULL,
  `header_style` varchar(50) DEFAULT 'classic',
  `sticky_header` tinyint(1) DEFAULT 1,
  `navigation_menu` text DEFAULT NULL,
  `primary_color` varchar(20) NOT NULL,
  `accent_color` varchar(20) NOT NULL,
  `body_color` varchar(20) DEFAULT '#1f2937',
  `bg_color` varchar(20) DEFAULT '#ffffff',
  `font_family` varchar(50) NOT NULL,
  `font_size` varchar(20) DEFAULT '15px',
  `sambutan_kepala` text DEFAULT NULL,
  `sambutan_link_slug` varchar(255) DEFAULT NULL,
  `sambutan_foto` varchar(255) DEFAULT NULL,
  `school_name` varchar(255) DEFAULT NULL,
  `school_description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `logo_url`, `favicon_url`, `phone`, `email`, `address`, `social_fb`, `social_tw`, `social_ig`, `social_yt`, `header_style`, `sticky_header`, `navigation_menu`, `primary_color`, `accent_color`, `body_color`, `bg_color`, `font_family`, `font_size`, `sambutan_kepala`, `sambutan_link_slug`, `sambutan_foto`, `school_name`, `school_description`) VALUES
(1, 'https://madarussalamcilongok.sch.id/uploads/69b173e3e0767_LogoMA150px.png', 'https://madarussalamcilongok.sch.id/uploads/69b173e3e0767_LogoMA150px.png', '+628112630731', 'masdarussalamcilongok@gmail.com', 'Kandangaur 04/02 Panusupan, Cilongok, Banyumas, Jawa Tengah 53162', 'https://facebook.com/', '', '', '', 'classic', 1, '[{\"id\":1773244828081,\"label\":\"Beranda\",\"type\":\"home\",\"slug\":\"\"},{\"id\":1773244835243,\"label\":\"Profil\",\"type\":\"dropdown\",\"slug\":\"\",\"children\":[{\"id\":1773244844468,\"label\":\"Tentang Kami\",\"type\":\"page\",\"slug\":\"tentang\",\"url\":\"\"},{\"id\":1773248198384,\"label\":\"Visi Misi\",\"type\":\"page\",\"slug\":\"visimisi\",\"url\":\"\"},{\"id\":1773248214270,\"label\":\"Guru & Staff\",\"type\":\"page\",\"slug\":\"guru\",\"url\":\"\"},{\"id\":1773248226134,\"label\":\"Fasilitas\",\"type\":\"page\",\"slug\":\"fasilitas\",\"url\":\"\"},{\"id\":1773248250195,\"label\":\"Dokumen\",\"type\":\"page\",\"slug\":\"file\",\"url\":\"\"}]},{\"id\":1773244889820,\"label\":\"Artikel\",\"type\":\"articles\",\"slug\":\"\"},{\"id\":1773244892093,\"label\":\"Agenda\",\"type\":\"agenda\",\"slug\":\"\"},{\"id\":1773244892760,\"label\":\"Pengumuman\",\"type\":\"announcements\",\"slug\":\"\"},{\"id\":1773244893353,\"label\":\"Ekstrakulikuler\",\"type\":\"ekskul\",\"slug\":\"\",\"children\":[{\"id\":1773245161651,\"label\":\"RDM\",\"type\":\"default\",\"slug\":\"\",\"url\":\"\"}]},{\"id\":1773270424054,\"label\":\"Aplikasi\",\"type\":\"dropdown\",\"slug\":\"\",\"children\":[{\"id\":1773270436084,\"label\":\"RDM\",\"type\":\"default\",\"slug\":\"\",\"url\":\"\"}]}]', '#006b37', '#ffcb0f', '#000000', '#ededed', 'Abel', '16px', '<p><em>Assalamu’alaikum&nbsp;Warahmatullahi&nbsp;Wabarakatuh,</em></p><p>Selamat&nbsp;datang&nbsp;di&nbsp;<em>official</em>&nbsp;website&nbsp;MA&nbsp;Darussalam&nbsp;Cilongok.</p><p>Segala&nbsp;puji&nbsp;bagi&nbsp;Allah&nbsp;Swt&nbsp;atas&nbsp;limpahan&nbsp;rahmat&nbsp;dan&nbsp;hidayah-Nya&nbsp;sehingga&nbsp;kita&nbsp;dapat&nbsp;terus&nbsp;melangkah&nbsp;dalam&nbsp;menjalankan&nbsp;amanah&nbsp;mencerdaskan&nbsp;generasi&nbsp;bangsa.&nbsp;Shalawat&nbsp;serta&nbsp;salam&nbsp;senantiasa&nbsp;tercurah&nbsp;kepada&nbsp;uswah&nbsp;hasanah&nbsp;kita,&nbsp;Nabi&nbsp;Muhammad&nbsp;Saw.</p>', 'sambutan', 'https://madarussalamcilongok.sch.id/uploads/69b304e58e691_ahmadpanusupan3x4.jpg', 'MA Darussalam Cilongok', 'Salah satu lembaga formal dari Yayasan Pendidikan Islam Darussalam Cilongok di bawah naungan Kementerian Agama yang berkomitmen mencetak generasi unggul, berprestasi, dan berakhlakul karimah.');

-- --------------------------------------------------------

--
-- Table structure for table `sliders`
--

CREATE TABLE `sliders` (
  `id` int(11) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `title` varchar(100) NOT NULL,
  `subtitle` varchar(255) NOT NULL,
  `button_text` varchar(50) DEFAULT 'Selengkapnya',
  `button_link` varchar(255) DEFAULT '#',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sliders`
--

INSERT INTO `sliders` (`id`, `image_url`, `title`, `subtitle`, `button_text`, `button_link`, `created_at`) VALUES
(8, 'https://madarussalamcilongok.sch.id/uploads/69b1fd528a25c_Pramuka.jpeg', 'SELAMAT DATANG', 'Media Resmi MA Darussalam Cilongok', '', '#', '2026-03-12 18:28:45'),
(9, 'https://madarussalamcilongok.sch.id/uploads/69b1fd435e098_Paskibra.jpeg', 'MARI BERGABUNG', 'Kita menimba ilmu dan berkembang bersama, menyiapkan diri untuk merengkuh masa depan dunia akhirat.', 'DAFTAR SEKARANG', 'https://daftar.darussalampanusupan.net', '2026-03-12 18:28:45');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `fullname` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('Admin','Editor','Read-Only','Demo') DEFAULT 'Editor',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `fullname`, `username`, `password`, `role`, `created_at`) VALUES
(1, 'Achmad Rois', 'ppds', '$2y$10$TkuzTiMPAyasSM6YH9n3qO84qAlJaR6LxZ9PnWMp/c240URT8kaNa', 'Admin', '2026-03-08 17:33:03'),
(2, 'Admin MADSC', 'madsc', '$2y$10$qh6FpLwlWLsyKM7DmVCQ4OLMRh3I0TG4bUCX.3OW4pfU/JoCOWAcS', 'Admin', '2026-03-08 22:25:50'),
(3, 'Demo WebMa', 'demo', '$2y$10$R0NZ12zLmGrzPDWdBZi7/ux9LberilO1L0/z.458.jcYhubWBesJG', 'Demo', '2026-03-09 15:23:49'),
(4, 'Operator', 'editormadsc', '$2y$10$p9tKFCkmXTBXI7usMg4NsOV/ZGzcJ3Rft9TDhl5gonmNwno799aqS', 'Editor', '2026-03-12 04:35:09');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `agendas`
--
ALTER TABLE `agendas`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `data_modules`
--
ALTER TABLE `data_modules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `data_module_fields`
--
ALTER TABLE `data_module_fields`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `data_module_rows`
--
ALTER TABLE `data_module_rows`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ekskul`
--
ALTER TABLE `ekskul`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `facilities`
--
ALTER TABLE `facilities`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `form_submissions`
--
ALTER TABLE `form_submissions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `gurus`
--
ALTER TABLE `gurus`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `media`
--
ALTER TABLE `media`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pages`
--
ALTER TABLE `pages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `posts`
--
ALTER TABLE `posts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sliders`
--
ALTER TABLE `sliders`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `agendas`
--
ALTER TABLE `agendas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `comments`
--
ALTER TABLE `comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `data_modules`
--
ALTER TABLE `data_modules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `data_module_fields`
--
ALTER TABLE `data_module_fields`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `data_module_rows`
--
ALTER TABLE `data_module_rows`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `documents`
--
ALTER TABLE `documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `ekskul`
--
ALTER TABLE `ekskul`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `facilities`
--
ALTER TABLE `facilities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `form_submissions`
--
ALTER TABLE `form_submissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gurus`
--
ALTER TABLE `gurus`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `media`
--
ALTER TABLE `media`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `pages`
--
ALTER TABLE `pages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `posts`
--
ALTER TABLE `posts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `sliders`
--
ALTER TABLE `sliders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
