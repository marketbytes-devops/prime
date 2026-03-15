-- MySQL dump 10.13  Distrib 8.0.44, for Linux (x86_64)
--
-- Host: localhost    Database: prime_db
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group`
--

LOCK TABLES `auth_group` WRITE;
/*!40000 ALTER TABLE `auth_group` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group_permissions`
--

LOCK TABLES `auth_group_permissions` WRITE;
/*!40000 ALTER TABLE `auth_group_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=145 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (1,'Can add log entry',1,'add_logentry'),(2,'Can change log entry',1,'change_logentry'),(3,'Can delete log entry',1,'delete_logentry'),(4,'Can view log entry',1,'view_logentry'),(5,'Can add permission',2,'add_permission'),(6,'Can change permission',2,'change_permission'),(7,'Can delete permission',2,'delete_permission'),(8,'Can view permission',2,'view_permission'),(9,'Can add group',3,'add_group'),(10,'Can change group',3,'change_group'),(11,'Can delete group',3,'delete_group'),(12,'Can view group',3,'view_group'),(13,'Can add content type',4,'add_contenttype'),(14,'Can change content type',4,'change_contenttype'),(15,'Can delete content type',4,'delete_contenttype'),(16,'Can view content type',4,'view_contenttype'),(17,'Can add session',5,'add_session'),(18,'Can change session',5,'change_session'),(19,'Can delete session',5,'delete_session'),(20,'Can view session',5,'view_session'),(21,'Can add crontab',6,'add_crontabschedule'),(22,'Can change crontab',6,'change_crontabschedule'),(23,'Can delete crontab',6,'delete_crontabschedule'),(24,'Can view crontab',6,'view_crontabschedule'),(25,'Can add interval',7,'add_intervalschedule'),(26,'Can change interval',7,'change_intervalschedule'),(27,'Can delete interval',7,'delete_intervalschedule'),(28,'Can view interval',7,'view_intervalschedule'),(29,'Can add periodic task',8,'add_periodictask'),(30,'Can change periodic task',8,'change_periodictask'),(31,'Can delete periodic task',8,'delete_periodictask'),(32,'Can view periodic task',8,'view_periodictask'),(33,'Can add periodic task track',9,'add_periodictasks'),(34,'Can change periodic task track',9,'change_periodictasks'),(35,'Can delete periodic task track',9,'delete_periodictasks'),(36,'Can view periodic task track',9,'view_periodictasks'),(37,'Can add solar event',10,'add_solarschedule'),(38,'Can change solar event',10,'change_solarschedule'),(39,'Can delete solar event',10,'delete_solarschedule'),(40,'Can view solar event',10,'view_solarschedule'),(41,'Can add clocked',11,'add_clockedschedule'),(42,'Can change clocked',11,'change_clockedschedule'),(43,'Can delete clocked',11,'delete_clockedschedule'),(44,'Can view clocked',11,'view_clockedschedule'),(45,'Can add task result',12,'add_taskresult'),(46,'Can change task result',12,'change_taskresult'),(47,'Can delete task result',12,'delete_taskresult'),(48,'Can view task result',12,'view_taskresult'),(49,'Can add chord counter',13,'add_chordcounter'),(50,'Can change chord counter',13,'change_chordcounter'),(51,'Can delete chord counter',13,'delete_chordcounter'),(52,'Can view chord counter',13,'view_chordcounter'),(53,'Can add group result',14,'add_groupresult'),(54,'Can change group result',14,'change_groupresult'),(55,'Can delete group result',14,'delete_groupresult'),(56,'Can view group result',14,'view_groupresult'),(57,'Can add user',15,'add_customuser'),(58,'Can change user',15,'change_customuser'),(59,'Can delete user',15,'delete_customuser'),(60,'Can view user',15,'view_customuser'),(61,'Can add role',16,'add_role'),(62,'Can change role',16,'change_role'),(63,'Can delete role',16,'delete_role'),(64,'Can view role',16,'view_role'),(65,'Can add permission',17,'add_permission'),(66,'Can change permission',17,'change_permission'),(67,'Can delete permission',17,'delete_permission'),(68,'Can view permission',17,'view_permission'),(69,'Can add item',18,'add_item'),(70,'Can change item',18,'change_item'),(71,'Can delete item',18,'delete_item'),(72,'Can view item',18,'view_item'),(73,'Can add unit',19,'add_unit'),(74,'Can change unit',19,'change_unit'),(75,'Can delete unit',19,'delete_unit'),(76,'Can view unit',19,'view_unit'),(77,'Can add team member',20,'add_teammember'),(78,'Can change team member',20,'change_teammember'),(79,'Can delete team member',20,'delete_teammember'),(80,'Can view team member',20,'view_teammember'),(81,'Can add technician',21,'add_technician'),(82,'Can change technician',21,'change_technician'),(83,'Can delete technician',21,'delete_technician'),(84,'Can view technician',21,'view_technician'),(85,'Can add rfq channel',22,'add_rfqchannel'),(86,'Can change rfq channel',22,'change_rfqchannel'),(87,'Can delete rfq channel',22,'delete_rfqchannel'),(88,'Can view rfq channel',22,'view_rfqchannel'),(89,'Can add number series',23,'add_numberseries'),(90,'Can change number series',23,'change_numberseries'),(91,'Can delete number series',23,'delete_numberseries'),(92,'Can view number series',23,'view_numberseries'),(93,'Can add rfq',24,'add_rfq'),(94,'Can change rfq',24,'change_rfq'),(95,'Can delete rfq',24,'delete_rfq'),(96,'Can view rfq',24,'view_rfq'),(97,'Can add rfq item',25,'add_rfqitem'),(98,'Can change rfq item',25,'change_rfqitem'),(99,'Can delete rfq item',25,'delete_rfqitem'),(100,'Can view rfq item',25,'view_rfqitem'),(101,'Can add quotation',26,'add_quotation'),(102,'Can change quotation',26,'change_quotation'),(103,'Can delete quotation',26,'delete_quotation'),(104,'Can view quotation',26,'view_quotation'),(105,'Can add quotation item',27,'add_quotationitem'),(106,'Can change quotation item',27,'change_quotationitem'),(107,'Can delete quotation item',27,'delete_quotationitem'),(108,'Can view quotation item',27,'view_quotationitem'),(109,'Can add purchase order',28,'add_purchaseorder'),(110,'Can change purchase order',28,'change_purchaseorder'),(111,'Can delete purchase order',28,'delete_purchaseorder'),(112,'Can view purchase order',28,'view_purchaseorder'),(113,'Can add purchase order item',29,'add_purchaseorderitem'),(114,'Can change purchase order item',29,'change_purchaseorderitem'),(115,'Can delete purchase order item',29,'delete_purchaseorderitem'),(116,'Can view purchase order item',29,'view_purchaseorderitem'),(117,'Can add quotation terms',30,'add_quotationterms'),(118,'Can change quotation terms',30,'change_quotationterms'),(119,'Can delete quotation terms',30,'delete_quotationterms'),(120,'Can view quotation terms',30,'view_quotationterms'),(121,'Can add delivery note',31,'add_deliverynote'),(122,'Can change delivery note',31,'change_deliverynote'),(123,'Can delete delivery note',31,'delete_deliverynote'),(124,'Can view delivery note',31,'view_deliverynote'),(125,'Can add delivery note item',32,'add_deliverynoteitem'),(126,'Can change delivery note item',32,'change_deliverynoteitem'),(127,'Can delete delivery note item',32,'delete_deliverynoteitem'),(128,'Can view delivery note item',32,'view_deliverynoteitem'),(129,'Can add delivery note item component',33,'add_deliverynoteitemcomponent'),(130,'Can change delivery note item component',33,'change_deliverynoteitemcomponent'),(131,'Can delete delivery note item component',33,'delete_deliverynoteitemcomponent'),(132,'Can view delivery note item component',33,'view_deliverynoteitemcomponent'),(133,'Can add work order',34,'add_workorder'),(134,'Can change work order',34,'change_workorder'),(135,'Can delete work order',34,'delete_workorder'),(136,'Can view work order',34,'view_workorder'),(137,'Can add work order item',35,'add_workorderitem'),(138,'Can change work order item',35,'change_workorderitem'),(139,'Can delete work order item',35,'delete_workorderitem'),(140,'Can view work order item',35,'view_workorderitem'),(141,'Can add invoice',36,'add_invoice'),(142,'Can change invoice',36,'change_invoice'),(143,'Can delete invoice',36,'delete_invoice'),(144,'Can view invoice',36,'view_invoice');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `authapp_customuser`
--

DROP TABLE IF EXISTS `authapp_customuser`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `authapp_customuser` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `first_name` varchar(150) NOT NULL,
  `last_name` varchar(150) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  `name` varchar(255) NOT NULL,
  `username` varchar(150) DEFAULT NULL,
  `email` varchar(254) NOT NULL,
  `address` longtext NOT NULL,
  `phone_number` varchar(15) NOT NULL,
  `image` varchar(100) DEFAULT NULL,
  `role_id` bigint DEFAULT NULL,
  `otp` varchar(6) DEFAULT NULL,
  `otp_created_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`),
  KEY `authapp_customuser_role_id_f4c73a2b_fk_authapp_role_id` (`role_id`),
  CONSTRAINT `authapp_customuser_role_id_f4c73a2b_fk_authapp_role_id` FOREIGN KEY (`role_id`) REFERENCES `authapp_role` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `authapp_customuser`
--

LOCK TABLES `authapp_customuser` WRITE;
/*!40000 ALTER TABLE `authapp_customuser` DISABLE KEYS */;
INSERT INTO `authapp_customuser` VALUES (1,'pbkdf2_sha256$1000000$jmn9K5ACO1p2WmdnNSluU3$ffezj+IDCjmTXFHkD5+5o7lLoSk8+lOLLJeGG+pAWUg=','2025-12-12 11:32:28.000000',1,'','',1,1,'2025-12-12 11:31:55.000000','Danny','Danny','danny@primearabiagroup.com','','','',1,NULL,NULL),(2,'pbkdf2_sha256$1000000$Yq2Haexa4IdSmuoZbuJZre$JDG/aAB7qu5ZD7uYTwpF+rayXs7RukYi6TfSLV0w7s8=',NULL,0,'','',0,1,'2025-12-12 11:36:46.232905','Donny','Donny','donny@primearabiagroup.com','','','',1,NULL,NULL),(3,'pbkdf2_sha256$1000000$MbwgM2cOr8v2DgsSJRwQ7b$TY2XVyGy3NJJfyBp4JBN5EWEdkwp9okLwXYZlflzyqo=',NULL,0,'','',0,1,'2025-12-12 11:37:15.985945','Leslie','Leslie','leslie@primearabiagroup.com','','','',1,NULL,NULL),(4,'pbkdf2_sha256$1000000$axOCLcqFeNVe4uwGJ0VQ1H$fQGFphy40dXGc41zthEWOqyjXQRQ3WxL6ru6r3Fasmo=',NULL,0,'','',0,1,'2025-12-12 11:37:48.743727','Hari','Hari','hari@primearabiagroup.com','','','',1,NULL,NULL),(5,'pbkdf2_sha256$1000000$hBQOx8hS1XhpkOVgZYhmA7$QV+Po3R6TkDCnmdmLMd8vXcbgiebXfmWLgp8VASdQbk=',NULL,0,'','',0,1,'2025-12-12 11:39:40.005561','Narayanan','Narayanan','allseasonholding@gmail.com','','','',2,NULL,NULL),(6,'pbkdf2_sha256$1000000$RZ6FICFxdD5YrZ4qU2OvhV$asNwJt4SDaKoYYGhp76xCTrLYoTZQe84tLgpPO+YUzw=',NULL,0,'','',0,1,'2025-12-12 11:40:18.939933','Faasil','Faasil','sales@primearabiagroup.com','','','',2,NULL,NULL),(7,'pbkdf2_sha256$1000000$qgRSKwYnkV8tXsQcp6A6gL$fGuYpkefTKLej0u94nrMtyGr5Yi2gu1oClYJoLEq0kI=',NULL,0,'','',0,1,'2025-12-12 11:40:49.303141','Stervin','Stervin','accounts@primearabiagroup.com','','','',3,NULL,NULL),(8,'pbkdf2_sha256$1000000$2hdOFexEVqjBbGaLmpLFoQ$oq3lCCUuakLhUnn0MDyzDErk34u1OkDt+5gn04rPVPM=',NULL,0,'','',0,1,'2025-12-12 11:41:32.661225','Mahesh','Mahesh','primeinnovation3@gmail.com','','','',4,NULL,NULL),(9,'pbkdf2_sha256$1000000$9UxHB23igCFO2Qh8WvmzaQ$MtRGbyCcVHixObWVwB/DJIntktyp6VtD91MrZt9k8W0=',NULL,0,'','',0,1,'2025-12-12 11:42:26.197172','Abhiram','Abhiram','calibration@primearabiagroup.com','','','',4,NULL,NULL);
/*!40000 ALTER TABLE `authapp_customuser` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `authapp_customuser_groups`
--

DROP TABLE IF EXISTS `authapp_customuser_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `authapp_customuser_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `customuser_id` bigint NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `authapp_customuser_groups_customuser_id_group_id_03af0264_uniq` (`customuser_id`,`group_id`),
  KEY `authapp_customuser_groups_group_id_4143a1f8_fk_auth_group_id` (`group_id`),
  CONSTRAINT `authapp_customuser_g_customuser_id_d338aa9f_fk_authapp_c` FOREIGN KEY (`customuser_id`) REFERENCES `authapp_customuser` (`id`),
  CONSTRAINT `authapp_customuser_groups_group_id_4143a1f8_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `authapp_customuser_groups`
--

LOCK TABLES `authapp_customuser_groups` WRITE;
/*!40000 ALTER TABLE `authapp_customuser_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `authapp_customuser_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `authapp_customuser_user_permissions`
--

DROP TABLE IF EXISTS `authapp_customuser_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `authapp_customuser_user_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `customuser_id` bigint NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `authapp_customuser_user__customuser_id_permission_abd7dbc4_uniq` (`customuser_id`,`permission_id`),
  KEY `authapp_customuser_u_permission_id_a4c601ab_fk_auth_perm` (`permission_id`),
  CONSTRAINT `authapp_customuser_u_customuser_id_5e7638ee_fk_authapp_c` FOREIGN KEY (`customuser_id`) REFERENCES `authapp_customuser` (`id`),
  CONSTRAINT `authapp_customuser_u_permission_id_a4c601ab_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `authapp_customuser_user_permissions`
--

LOCK TABLES `authapp_customuser_user_permissions` WRITE;
/*!40000 ALTER TABLE `authapp_customuser_user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `authapp_customuser_user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `authapp_permission`
--

DROP TABLE IF EXISTS `authapp_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `authapp_permission` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `page` varchar(100) NOT NULL,
  `can_view` tinyint(1) NOT NULL,
  `can_add` tinyint(1) NOT NULL,
  `can_edit` tinyint(1) NOT NULL,
  `can_delete` tinyint(1) NOT NULL,
  `role_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `authapp_permission_role_id_page_2789f33f_uniq` (`role_id`,`page`),
  CONSTRAINT `authapp_permission_role_id_4ab5eac4_fk_authapp_role_id` FOREIGN KEY (`role_id`) REFERENCES `authapp_role` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `authapp_permission`
--

LOCK TABLES `authapp_permission` WRITE;
/*!40000 ALTER TABLE `authapp_permission` DISABLE KEYS */;
INSERT INTO `authapp_permission` VALUES (1,'Dashboard',1,1,1,1,1),(2,'Profile',1,1,1,1,1),(3,'rfq',1,1,1,1,1),(4,'quotation',1,1,1,1,1),(5,'purchase_orders',1,1,1,1,1),(6,'processing_work_orders',1,1,1,1,1),(7,'manager_approval',1,1,1,1,1),(8,'delivery',1,1,1,1,1),(9,'pending_invoices',1,1,1,1,1),(10,'raised_invoices',1,1,1,1,1),(11,'processed_invoices',1,1,1,1,1),(12,'view_reports',1,0,0,0,1),(13,'due_date_reports',1,0,0,0,1),(14,'series',1,1,1,1,1),(15,'rfq_channel',1,1,1,1,1),(16,'item',1,1,1,1,1),(17,'unit',1,1,1,1,1),(18,'team',1,1,1,1,1),(19,'users',1,1,1,1,1),(20,'roles',1,1,1,1,1),(21,'permissions',1,1,1,1,1),(22,'pending_deliveries',1,1,1,1,1),(23,'declined_work_orders',1,1,1,1,1),(24,'pricing',1,1,1,1,1),(25,'Dashboard',1,1,1,1,2),(26,'Profile',1,1,1,1,2),(27,'rfq',1,1,1,1,2),(28,'quotation',1,1,1,1,2),(29,'purchase_orders',1,1,1,1,2),(30,'processing_work_orders',1,1,1,1,2),(31,'manager_approval',1,1,1,1,2),(32,'delivery',1,1,1,1,2),(33,'pending_invoices',1,1,1,1,2),(34,'raised_invoices',1,1,1,1,2),(35,'processed_invoices',1,1,1,1,2),(36,'view_reports',1,0,0,0,2),(37,'due_date_reports',1,0,0,0,2),(38,'series',1,1,1,1,2),(39,'rfq_channel',1,1,1,1,2),(40,'item',1,1,1,1,2),(41,'unit',1,1,1,1,2),(42,'team',1,1,1,1,2),(43,'users',1,1,1,1,2),(44,'roles',1,1,1,1,2),(45,'permissions',1,1,1,1,2),(46,'pending_deliveries',1,1,1,1,2),(47,'declined_work_orders',1,1,1,1,2),(48,'pricing',1,1,1,1,2),(49,'Dashboard',1,0,0,0,3),(50,'Profile',1,0,0,0,3),(51,'rfq',1,0,0,0,3),(52,'quotation',1,0,0,0,3),(53,'purchase_orders',1,0,0,0,3),(54,'processing_work_orders',1,0,0,0,3),(55,'manager_approval',1,0,0,0,3),(56,'delivery',1,0,0,0,3),(57,'pending_invoices',1,0,0,0,3),(58,'raised_invoices',1,0,0,0,3),(59,'processed_invoices',1,0,0,0,3),(60,'view_reports',1,0,0,0,3),(61,'due_date_reports',1,0,0,0,3),(62,'series',1,0,0,0,3),(63,'rfq_channel',1,0,0,0,3),(64,'item',1,0,0,0,3),(65,'unit',1,0,0,0,3),(66,'team',1,0,0,0,3),(67,'users',1,0,0,0,3),(68,'roles',1,0,0,0,3),(69,'permissions',1,0,0,0,3),(70,'pending_deliveries',1,0,0,0,3),(71,'declined_work_orders',1,0,0,0,3),(72,'pricing',1,0,0,0,3),(73,'Dashboard',1,0,0,0,4),(74,'Profile',1,0,0,0,4),(75,'rfq',1,0,0,0,4),(76,'quotation',1,0,0,0,4),(77,'purchase_orders',1,0,0,0,4),(78,'processing_work_orders',1,0,0,0,4),(79,'manager_approval',1,0,0,0,4),(80,'delivery',1,0,0,0,4),(81,'pending_invoices',1,0,0,0,4),(82,'raised_invoices',1,0,0,0,4),(83,'processed_invoices',1,0,0,0,4),(84,'view_reports',1,0,0,0,4),(85,'due_date_reports',1,0,0,0,4),(86,'series',1,0,0,0,4),(87,'rfq_channel',1,0,0,0,4),(88,'item',1,0,0,0,4),(89,'unit',1,0,0,0,4),(90,'team',1,0,0,0,4),(91,'users',1,0,0,0,4),(92,'roles',1,0,0,0,4),(93,'permissions',1,0,0,0,4),(94,'pending_deliveries',1,0,0,0,4),(95,'declined_work_orders',1,0,0,0,4),(96,'pricing',1,0,0,0,4);
/*!40000 ALTER TABLE `authapp_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `authapp_role`
--

DROP TABLE IF EXISTS `authapp_role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `authapp_role` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` longtext NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `authapp_role`
--

LOCK TABLES `authapp_role` WRITE;
/*!40000 ALTER TABLE `authapp_role` DISABLE KEYS */;
INSERT INTO `authapp_role` VALUES (1,'Superadmin','Can access anything'),(2,'Sales','Only Sales related pages'),(3,'Accounts','Only account related pages'),(4,'Calibration','Only Caliberation related pages');
/*!40000 ALTER TABLE `authapp_role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `channels_rfqchannel`
--

DROP TABLE IF EXISTS `channels_rfqchannel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `channels_rfqchannel` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `channel_name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `channel_name` (`channel_name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `channels_rfqchannel`
--

LOCK TABLES `channels_rfqchannel` WRITE;
/*!40000 ALTER TABLE `channels_rfqchannel` DISABLE KEYS */;
INSERT INTO `channels_rfqchannel` VALUES (1,'Email'),(2,'Whatsapp');
/*!40000 ALTER TABLE `channels_rfqchannel` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_admin_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext NOT NULL,
  `content_type_id` int DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_authapp_customuser_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_authapp_customuser_id` FOREIGN KEY (`user_id`) REFERENCES `authapp_customuser` (`id`),
  CONSTRAINT `django_admin_log_chk_1` CHECK ((`action_flag` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_admin_log`
--

LOCK TABLES `django_admin_log` WRITE;
/*!40000 ALTER TABLE `django_admin_log` DISABLE KEYS */;
INSERT INTO `django_admin_log` VALUES (1,'2025-12-12 11:32:55.691556','1','Superadmin',1,'[{\"added\": {}}]',16,1),(2,'2025-12-12 11:33:04.055839','1','danny@primearabiagroup.com',2,'[{\"changed\": {\"fields\": [\"Role\"]}}]',15,1),(3,'2025-12-12 11:36:46.400646','2','donny@primearabiagroup.com',1,'[{\"added\": {}}]',15,1),(4,'2025-12-12 11:37:16.146314','3','leslie@primearabiagroup.com',1,'[{\"added\": {}}]',15,1),(5,'2025-12-12 11:37:48.918792','4','hari@primearabiagroup.com',1,'[{\"added\": {}}]',15,1),(6,'2025-12-12 11:38:06.980661','2','Sales',1,'[{\"added\": {}}]',16,1),(7,'2025-12-12 11:38:23.221059','3','Accounts',1,'[{\"added\": {}}]',16,1),(8,'2025-12-12 11:38:56.049981','4','Calibration',1,'[{\"added\": {}}]',16,1),(9,'2025-12-12 11:39:40.211267','5','allseasonholding@gmail.com',1,'[{\"added\": {}}]',15,1),(10,'2025-12-12 11:40:19.117226','6','sales@primearabiagroup.com',1,'[{\"added\": {}}]',15,1),(11,'2025-12-12 11:40:49.483913','7','accounts@primearabiagroup.com',1,'[{\"added\": {}}]',15,1),(12,'2025-12-12 11:41:32.827412','8','primeinnovation3@gmail.com',1,'[{\"added\": {}}]',15,1),(13,'2025-12-12 11:42:06.367852','1','danny@primearabiagroup.com',2,'[{\"changed\": {\"fields\": [\"Username\", \"Name\"]}}]',15,1),(14,'2025-12-12 11:42:26.381191','9','calibration@primearabiagroup.com',1,'[{\"added\": {}}]',15,1);
/*!40000 ALTER TABLE `django_admin_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_celery_beat_clockedschedule`
--

DROP TABLE IF EXISTS `django_celery_beat_clockedschedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_celery_beat_clockedschedule` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clocked_time` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_celery_beat_clockedschedule`
--

LOCK TABLES `django_celery_beat_clockedschedule` WRITE;
/*!40000 ALTER TABLE `django_celery_beat_clockedschedule` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_celery_beat_clockedschedule` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_celery_beat_crontabschedule`
--

DROP TABLE IF EXISTS `django_celery_beat_crontabschedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_celery_beat_crontabschedule` (
  `id` int NOT NULL AUTO_INCREMENT,
  `minute` varchar(240) NOT NULL,
  `hour` varchar(96) NOT NULL,
  `day_of_week` varchar(64) NOT NULL,
  `day_of_month` varchar(124) NOT NULL,
  `month_of_year` varchar(64) NOT NULL,
  `timezone` varchar(63) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_celery_beat_crontabschedule`
--

LOCK TABLES `django_celery_beat_crontabschedule` WRITE;
/*!40000 ALTER TABLE `django_celery_beat_crontabschedule` DISABLE KEYS */;
INSERT INTO `django_celery_beat_crontabschedule` VALUES (1,'0','4','*','*','*','UTC');
/*!40000 ALTER TABLE `django_celery_beat_crontabschedule` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_celery_beat_intervalschedule`
--

DROP TABLE IF EXISTS `django_celery_beat_intervalschedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_celery_beat_intervalschedule` (
  `id` int NOT NULL AUTO_INCREMENT,
  `every` int NOT NULL,
  `period` varchar(24) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_celery_beat_intervalschedule`
--

LOCK TABLES `django_celery_beat_intervalschedule` WRITE;
/*!40000 ALTER TABLE `django_celery_beat_intervalschedule` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_celery_beat_intervalschedule` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_celery_beat_periodictask`
--

DROP TABLE IF EXISTS `django_celery_beat_periodictask`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_celery_beat_periodictask` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `task` varchar(200) NOT NULL,
  `args` longtext NOT NULL,
  `kwargs` longtext NOT NULL,
  `queue` varchar(200) DEFAULT NULL,
  `exchange` varchar(200) DEFAULT NULL,
  `routing_key` varchar(200) DEFAULT NULL,
  `expires` datetime(6) DEFAULT NULL,
  `enabled` tinyint(1) NOT NULL,
  `last_run_at` datetime(6) DEFAULT NULL,
  `total_run_count` int unsigned NOT NULL,
  `date_changed` datetime(6) NOT NULL,
  `description` longtext NOT NULL,
  `crontab_id` int DEFAULT NULL,
  `interval_id` int DEFAULT NULL,
  `solar_id` int DEFAULT NULL,
  `one_off` tinyint(1) NOT NULL,
  `start_time` datetime(6) DEFAULT NULL,
  `priority` int unsigned DEFAULT NULL,
  `headers` longtext NOT NULL DEFAULT (_utf8mb4'{}'),
  `clocked_id` int DEFAULT NULL,
  `expire_seconds` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `django_celery_beat_p_crontab_id_d3cba168_fk_django_ce` (`crontab_id`),
  KEY `django_celery_beat_p_interval_id_a8ca27da_fk_django_ce` (`interval_id`),
  KEY `django_celery_beat_p_solar_id_a87ce72c_fk_django_ce` (`solar_id`),
  KEY `django_celery_beat_p_clocked_id_47a69f82_fk_django_ce` (`clocked_id`),
  CONSTRAINT `django_celery_beat_p_clocked_id_47a69f82_fk_django_ce` FOREIGN KEY (`clocked_id`) REFERENCES `django_celery_beat_clockedschedule` (`id`),
  CONSTRAINT `django_celery_beat_p_crontab_id_d3cba168_fk_django_ce` FOREIGN KEY (`crontab_id`) REFERENCES `django_celery_beat_crontabschedule` (`id`),
  CONSTRAINT `django_celery_beat_p_interval_id_a8ca27da_fk_django_ce` FOREIGN KEY (`interval_id`) REFERENCES `django_celery_beat_intervalschedule` (`id`),
  CONSTRAINT `django_celery_beat_p_solar_id_a87ce72c_fk_django_ce` FOREIGN KEY (`solar_id`) REFERENCES `django_celery_beat_solarschedule` (`id`),
  CONSTRAINT `django_celery_beat_periodictask_chk_1` CHECK ((`total_run_count` >= 0)),
  CONSTRAINT `django_celery_beat_periodictask_chk_2` CHECK ((`priority` >= 0)),
  CONSTRAINT `django_celery_beat_periodictask_chk_3` CHECK ((`expire_seconds` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_celery_beat_periodictask`
--

LOCK TABLES `django_celery_beat_periodictask` WRITE;
/*!40000 ALTER TABLE `django_celery_beat_periodictask` DISABLE KEYS */;
INSERT INTO `django_celery_beat_periodictask` VALUES (1,'celery.backend_cleanup','celery.backend_cleanup','[]','{}',NULL,NULL,NULL,NULL,1,'2026-03-15 12:44:20.934455',87,'2026-03-15 12:44:24.035096','',1,NULL,NULL,0,NULL,NULL,'{}',NULL,43200);
/*!40000 ALTER TABLE `django_celery_beat_periodictask` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_celery_beat_periodictasks`
--

DROP TABLE IF EXISTS `django_celery_beat_periodictasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_celery_beat_periodictasks` (
  `ident` smallint NOT NULL,
  `last_update` datetime(6) NOT NULL,
  PRIMARY KEY (`ident`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_celery_beat_periodictasks`
--

LOCK TABLES `django_celery_beat_periodictasks` WRITE;
/*!40000 ALTER TABLE `django_celery_beat_periodictasks` DISABLE KEYS */;
INSERT INTO `django_celery_beat_periodictasks` VALUES (1,'2026-03-15 12:44:19.829715');
/*!40000 ALTER TABLE `django_celery_beat_periodictasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_celery_beat_solarschedule`
--

DROP TABLE IF EXISTS `django_celery_beat_solarschedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_celery_beat_solarschedule` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event` varchar(24) NOT NULL,
  `latitude` decimal(9,6) NOT NULL,
  `longitude` decimal(9,6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_celery_beat_solar_event_latitude_longitude_ba64999a_uniq` (`event`,`latitude`,`longitude`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_celery_beat_solarschedule`
--

LOCK TABLES `django_celery_beat_solarschedule` WRITE;
/*!40000 ALTER TABLE `django_celery_beat_solarschedule` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_celery_beat_solarschedule` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_celery_results_chordcounter`
--

DROP TABLE IF EXISTS `django_celery_results_chordcounter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_celery_results_chordcounter` (
  `id` int NOT NULL AUTO_INCREMENT,
  `group_id` varchar(255) NOT NULL,
  `sub_tasks` longtext NOT NULL,
  `count` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `group_id` (`group_id`),
  CONSTRAINT `django_celery_results_chordcounter_chk_1` CHECK ((`count` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_celery_results_chordcounter`
--

LOCK TABLES `django_celery_results_chordcounter` WRITE;
/*!40000 ALTER TABLE `django_celery_results_chordcounter` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_celery_results_chordcounter` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_celery_results_groupresult`
--

DROP TABLE IF EXISTS `django_celery_results_groupresult`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_celery_results_groupresult` (
  `id` int NOT NULL AUTO_INCREMENT,
  `group_id` varchar(255) NOT NULL,
  `date_created` datetime(6) NOT NULL,
  `date_done` datetime(6) NOT NULL,
  `content_type` varchar(128) NOT NULL,
  `content_encoding` varchar(64) NOT NULL,
  `result` longtext,
  PRIMARY KEY (`id`),
  UNIQUE KEY `group_id` (`group_id`),
  KEY `django_cele_date_cr_bd6c1d_idx` (`date_created`),
  KEY `django_cele_date_do_caae0e_idx` (`date_done`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_celery_results_groupresult`
--

LOCK TABLES `django_celery_results_groupresult` WRITE;
/*!40000 ALTER TABLE `django_celery_results_groupresult` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_celery_results_groupresult` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_celery_results_taskresult`
--

DROP TABLE IF EXISTS `django_celery_results_taskresult`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_celery_results_taskresult` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` varchar(255) NOT NULL,
  `status` varchar(50) NOT NULL,
  `content_type` varchar(128) NOT NULL,
  `content_encoding` varchar(64) NOT NULL,
  `result` longtext,
  `date_done` datetime(6) NOT NULL,
  `traceback` longtext,
  `meta` longtext,
  `task_args` longtext,
  `task_kwargs` longtext,
  `task_name` varchar(255) DEFAULT NULL,
  `worker` varchar(100) DEFAULT NULL,
  `date_created` datetime(6) NOT NULL,
  `periodic_task_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `task_id` (`task_id`),
  KEY `django_cele_task_na_08aec9_idx` (`task_name`),
  KEY `django_cele_status_9b6201_idx` (`status`),
  KEY `django_cele_worker_d54dd8_idx` (`worker`),
  KEY `django_cele_date_cr_f04a50_idx` (`date_created`),
  KEY `django_cele_date_do_f59aad_idx` (`date_done`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_celery_results_taskresult`
--

LOCK TABLES `django_celery_results_taskresult` WRITE;
/*!40000 ALTER TABLE `django_celery_results_taskresult` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_celery_results_taskresult` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_content_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES (1,'admin','logentry'),(3,'auth','group'),(2,'auth','permission'),(15,'authapp','customuser'),(17,'authapp','permission'),(16,'authapp','role'),(22,'channels','rfqchannel'),(4,'contenttypes','contenttype'),(11,'django_celery_beat','clockedschedule'),(6,'django_celery_beat','crontabschedule'),(7,'django_celery_beat','intervalschedule'),(8,'django_celery_beat','periodictask'),(9,'django_celery_beat','periodictasks'),(10,'django_celery_beat','solarschedule'),(13,'django_celery_results','chordcounter'),(14,'django_celery_results','groupresult'),(12,'django_celery_results','taskresult'),(18,'item','item'),(31,'job_execution','deliverynote'),(32,'job_execution','deliverynoteitem'),(33,'job_execution','deliverynoteitemcomponent'),(36,'job_execution','invoice'),(34,'job_execution','workorder'),(35,'job_execution','workorderitem'),(28,'pre_job','purchaseorder'),(29,'pre_job','purchaseorderitem'),(26,'pre_job','quotation'),(27,'pre_job','quotationitem'),(30,'pre_job','quotationterms'),(24,'pre_job','rfq'),(25,'pre_job','rfqitem'),(23,'series','numberseries'),(5,'sessions','session'),(20,'team','teammember'),(21,'team','technician'),(19,'unit','unit');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=98 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES (1,'contenttypes','0001_initial','2025-12-12 11:27:22.928422'),(2,'contenttypes','0002_remove_content_type_name','2025-12-12 11:27:22.998892'),(3,'auth','0001_initial','2025-12-12 11:27:23.211077'),(4,'auth','0002_alter_permission_name_max_length','2025-12-12 11:27:23.258312'),(5,'auth','0003_alter_user_email_max_length','2025-12-12 11:27:23.266315'),(6,'auth','0004_alter_user_username_opts','2025-12-12 11:27:23.272419'),(7,'auth','0005_alter_user_last_login_null','2025-12-12 11:27:23.277639'),(8,'auth','0006_require_contenttypes_0002','2025-12-12 11:27:23.280976'),(9,'auth','0007_alter_validators_add_error_messages','2025-12-12 11:27:23.287582'),(10,'auth','0008_alter_user_username_max_length','2025-12-12 11:27:23.293257'),(11,'auth','0009_alter_user_last_name_max_length','2025-12-12 11:27:23.299053'),(12,'auth','0010_alter_group_name_max_length','2025-12-12 11:27:23.311584'),(13,'auth','0011_update_proxy_permissions','2025-12-12 11:27:23.319720'),(14,'auth','0012_alter_user_first_name_max_length','2025-12-12 11:27:23.326221'),(15,'authapp','0001_initial','2025-12-12 11:27:23.574601'),(16,'admin','0001_initial','2025-12-12 11:27:23.676267'),(17,'admin','0002_logentry_remove_auto_add','2025-12-12 11:27:23.683612'),(18,'admin','0003_logentry_add_action_flag_choices','2025-12-12 11:27:23.690366'),(19,'authapp','0002_role_customuser_role_permission','2025-12-12 11:27:23.824537'),(20,'authapp','0003_alter_customuser_username','2025-12-12 11:27:23.867512'),(21,'authapp','0004_alter_customuser_managers','2025-12-12 11:27:23.875213'),(22,'authapp','0005_customuser_otp_customuser_otp_created_at','2025-12-12 11:27:23.981403'),(23,'channels','0001_initial','2025-12-12 11:27:24.010459'),(24,'django_celery_beat','0001_initial','2025-12-12 11:27:24.210567'),(25,'django_celery_beat','0002_auto_20161118_0346','2025-12-12 11:27:24.305150'),(26,'django_celery_beat','0003_auto_20161209_0049','2025-12-12 11:27:24.327251'),(27,'django_celery_beat','0004_auto_20170221_0000','2025-12-12 11:27:24.332528'),(28,'django_celery_beat','0005_add_solarschedule_events_choices','2025-12-12 11:27:24.336740'),(29,'django_celery_beat','0006_auto_20180322_0932','2025-12-12 11:27:24.435869'),(30,'django_celery_beat','0007_auto_20180521_0826','2025-12-12 11:27:24.537923'),(31,'django_celery_beat','0008_auto_20180914_1922','2025-12-12 11:27:24.560534'),(32,'django_celery_beat','0006_auto_20180210_1226','2025-12-12 11:27:24.579695'),(33,'django_celery_beat','0006_periodictask_priority','2025-12-12 11:27:24.645621'),(34,'django_celery_beat','0009_periodictask_headers','2025-12-12 11:27:24.711268'),(35,'django_celery_beat','0010_auto_20190429_0326','2025-12-12 11:27:24.950083'),(36,'django_celery_beat','0011_auto_20190508_0153','2025-12-12 11:27:25.077550'),(37,'django_celery_beat','0012_periodictask_expire_seconds','2025-12-12 11:27:25.164631'),(38,'django_celery_beat','0013_auto_20200609_0727','2025-12-12 11:27:25.177450'),(39,'django_celery_beat','0014_remove_clockedschedule_enabled','2025-12-12 11:27:25.212846'),(40,'django_celery_beat','0015_edit_solarschedule_events_choices','2025-12-12 11:27:25.219390'),(41,'django_celery_beat','0016_alter_crontabschedule_timezone','2025-12-12 11:27:25.229164'),(42,'django_celery_beat','0017_alter_crontabschedule_month_of_year','2025-12-12 11:27:25.236501'),(43,'django_celery_beat','0018_improve_crontab_helptext','2025-12-12 11:27:25.245936'),(44,'django_celery_beat','0019_alter_periodictasks_options','2025-12-12 11:27:25.249407'),(45,'django_celery_results','0001_initial','2025-12-12 11:27:25.305070'),(46,'django_celery_results','0002_add_task_name_args_kwargs','2025-12-12 11:27:25.411640'),(47,'django_celery_results','0003_auto_20181106_1101','2025-12-12 11:27:25.415912'),(48,'django_celery_results','0004_auto_20190516_0412','2025-12-12 11:27:25.475425'),(49,'django_celery_results','0005_taskresult_worker','2025-12-12 11:27:25.568395'),(50,'django_celery_results','0006_taskresult_date_created','2025-12-12 11:27:25.658992'),(51,'django_celery_results','0007_remove_taskresult_hidden','2025-12-12 11:27:25.723314'),(52,'django_celery_results','0008_chordcounter','2025-12-12 11:27:25.748117'),(53,'django_celery_results','0009_groupresult','2025-12-12 11:27:26.024962'),(54,'django_celery_results','0010_remove_duplicate_indices','2025-12-12 11:27:26.033115'),(55,'django_celery_results','0011_taskresult_periodic_task_name','2025-12-12 11:27:26.090155'),(56,'item','0001_initial','2025-12-12 11:27:26.122334'),(57,'unit','0001_initial','2025-12-12 11:27:26.143183'),(58,'team','0001_initial','2025-12-12 11:27:26.174302'),(59,'team','0002_technician','2025-12-12 11:27:26.208050'),(60,'series','0001_initial','2025-12-12 11:27:26.233406'),(61,'pre_job','0001_initial','2025-12-12 11:27:26.551990'),(62,'pre_job','0002_rfq_series_number','2025-12-12 11:27:26.586705'),(63,'pre_job','0003_quotation_quotationitem','2025-12-12 11:27:26.897269'),(64,'pre_job','0004_purchaseorder_purchaseorderitem','2025-12-12 11:27:27.153417'),(65,'pre_job','0005_remove_purchaseorder_series_number','2025-12-12 11:27:27.195146'),(66,'pre_job','0006_purchaseorder_series_number','2025-12-12 11:27:27.240830'),(67,'pre_job','0007_purchaseorder_status','2025-12-12 11:27:27.295308'),(68,'pre_job','0008_alter_purchaseorder_status','2025-12-12 11:27:27.303277'),(69,'pre_job','0009_alter_rfq_rfq_status','2025-12-12 11:27:27.309877'),(70,'pre_job','0010_quotation_not_approved_reason_remark_and_more','2025-12-12 11:27:27.382016'),(71,'job_execution','0001_initial','2025-12-12 11:27:28.173085'),(72,'job_execution','0002_workorder_invoice_file','2025-12-12 11:27:28.277694'),(73,'job_execution','0003_workorder_payment_reference_number','2025-12-12 11:27:28.342710'),(74,'job_execution','0004_alter_workorder_invoice_status','2025-12-12 11:27:28.355641'),(75,'job_execution','0005_alter_deliverynote_options_deliverynote_due_in_days_and_more','2025-12-12 11:27:28.605453'),(76,'job_execution','0006_alter_deliverynote_options_and_more','2025-12-12 11:27:28.807342'),(77,'job_execution','0007_workorder_invoice_delivery_note','2025-12-12 11:27:28.883092'),(78,'job_execution','0008_remove_workorder_due_in_days_and_more','2025-12-12 11:27:29.491411'),(79,'job_execution','0009_alter_deliverynoteitem_invoice_file','2025-12-12 11:27:29.501556'),(80,'job_execution','0010_remove_deliverynoteitem_invoice_file_and_more','2025-12-12 11:27:29.589853'),(81,'job_execution','0011_rename_final_invoice_file_deliverynoteitem_invoice_file','2025-12-12 11:27:29.626153'),(82,'job_execution','0012_remove_deliverynoteitem_due_in_days_and_more','2025-12-12 11:27:30.025400'),(83,'job_execution','0013_alter_invoice_invoice_file','2025-12-12 11:27:30.035240'),(84,'job_execution','0014_alter_invoice_delivery_note','2025-12-12 11:27:30.155375'),(85,'job_execution','0015_remove_invoice_invoice_file_and_more','2025-12-12 11:27:30.270356'),(86,'job_execution','0016_invoice_remarks_invoice_signed_invoice_file','2025-12-12 11:27:30.362414'),(87,'pre_job','0011_rfq_email_sent','2025-12-12 11:27:30.497221'),(88,'pre_job','0012_quotation_email_sent','2025-12-12 11:27:30.565747'),(89,'pre_job','0013_quotation_vat_applicable_rfq_vat_applicable','2025-12-12 11:27:30.677070'),(90,'pre_job','0014_remove_rfq_email_sent','2025-12-12 11:27:30.718955'),(91,'pre_job','0015_quotationterms_quotation_terms','2025-12-12 11:27:30.810399'),(92,'pre_job','0016_rfq_email_sent','2025-12-12 11:27:30.872657'),(93,'pre_job','0017_alter_quotation_company_phone_and_more','2025-12-12 11:27:30.963860'),(94,'pre_job','0018_alter_rfq_company_phone_and_more','2025-12-12 11:27:31.096594'),(95,'pre_job','0019_quotationterms_is_default','2025-12-12 11:27:31.141954'),(96,'pre_job','0020_alter_quotationterms_options_and_more','2025-12-12 11:27:31.182706'),(97,'sessions','0001_initial','2025-12-12 11:27:31.229249');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_session`
--

LOCK TABLES `django_session` WRITE;
/*!40000 ALTER TABLE `django_session` DISABLE KEYS */;
INSERT INTO `django_session` VALUES ('z3uhc9ciqypp1kimujjj2a0kllhx4id4','.eJxVjMEOwiAQRP-FsyGAlAWP3v0GsguLVA1NSnsy_rtt0oPeJvPezFtEXJca185zHLO4CC1Ovx1henLbQX5gu08yTW2ZR5K7Ig_a5W3K_Loe7t9BxV63tcfB-JAsOK81oypkbYJQlGdVuJzBD6gCoFHg9ZbRmUAa0JFJTAnF5wvQnjfX:1vU1Ns:YLV5lj0kSuMl-DppJuav8oLMP_DfRRu32WPS5i2Ud2g','2025-12-26 11:32:28.759912');
/*!40000 ALTER TABLE `django_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_item`
--

DROP TABLE IF EXISTS `item_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_item` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=461 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_item`
--

LOCK TABLES `item_item` WRITE;
/*!40000 ALTER TABLE `item_item` DISABLE KEYS */;
INSERT INTO `item_item` VALUES (1,'Pressure Gauge','2025-12-12 11:45:44.456290'),(2,'MEASURING DEVICE: MULTI-GAS DETECTOR','2025-12-15 04:59:29.822527'),(3,'MEASURING DEVICE: ULTRAMETER 6PIIFC MYRON','2025-12-15 04:59:29.884127'),(4,'MEASURING DEVICE: ULTRAMETER II 6PIIFC MYRON','2025-12-15 04:59:29.937558'),(5,'FAS- TOOLS & EQUIPMENTS Fluke 945 Sound Meter','2025-12-15 04:59:29.991819'),(6,'FAS- TOOLS & EQUIPMENTS LIGHT METER FLUKE-941','2025-12-15 04:59:30.054411'),(7,'FAS- TOOLS & EQUIPMENTS INSULATION RESISTANCE TESTER, FLUKE 1507','2025-12-15 04:59:30.128729'),(8,'MEASURING DEVICE: PHASE SEQUENCE TESTER TKF-12 SONEL','2025-12-15 04:59:30.187586'),(9,'CALIBRATION: ANALOG MULTIMETER - ANALOG MULTI METER','2025-12-15 04:59:30.241641'),(10,'DIGITAL MULTIMETER','2025-12-15 04:59:30.352867'),(11,'LEAK DETECTOR REFRIGERANT WJL-6000S 30F - 125F DEG ELITECH FREON HVAC LEAK DETECTOR','2025-12-15 04:59:30.408630'),(12,'TOOLS TONE GENERATOR PROSKIT 3','2025-12-15 04:59:30.463324'),(13,'MEASURING DEVICE: CLAMP METER MODEL NO. 2007R','2025-12-15 04:59:30.520866'),(14,'FAS- TOOLS & EQUIPMENTS - EXTECH LUX METER 407026','2025-12-15 04:59:30.630520'),(15,'MEASURING DEVICE: HALOGON LEAK DETECTOR, HLD100, ELITECH','2025-12-15 04:59:30.741484'),(16,'FAS- TOOLS & EQUIPMENTS - CABLE DETECTOR FLUKE 2042 (CABLE LOCATOR)','2025-12-15 04:59:30.800779'),(17,'FAS- TOOLS & EQUIPMENTS Fluke 6500-2 UK Portable Appliance Tester Kit','2025-12-15 04:59:30.855775'),(18,'FAS-TOOLS & EQUIPMENTS - INSULATION RESISTANCE METERSONEL MIC-10K1','2025-12-15 04:59:30.913414'),(19,'FAS- TOOLS & EQUIPMENTS - [84-656] BRIGHT LASER-POWERED VISIFAULT VISUAL FAULT LOCATOR(VFL) COMPATIBLE WITH\n2.5MM AND 1.25MM CONNECTORS.','2025-12-15 04:59:30.969184'),(20,'FAS- TOOLS & EQUIPMENTS - [85-783] OPTIFIBER PRO QUAD OTDR MODULE V2, W/WIFI\nMODEL : OFP2-100-Q INT MAKE: FLUKE NETWORK','2025-12-15 04:59:31.027603'),(21,'MEGGER 10KV, INSULATION TESTER MIT 1025','2025-12-15 04:59:31.085030'),(22,'MEASURING DEVICE: LAN CABLE TESTER, MODEL TCT-1620','2025-12-15 04:59:31.156707'),(23,'THERMOMETER INFRARED FLUKE 62M','2025-12-15 04:59:31.277847'),(24,'MEASURING DEVICE: GAS LEAK DETECTOR - PORTABLE GAS DETECTOR WITH RECHARGEABLE BATTERY','2025-12-15 04:59:31.549867'),(25,'MULTIMETER DIGITAL 600V CD 800 SANWA (ANALOG)','2025-12-15 04:59:31.861988'),(26,'MEASURING DEVICE: MULTIMETER MODEL NO. KEW 1109S','2025-12-15 04:59:32.720510'),(27,'Glass Thermometer','2025-12-17 10:09:19.189581'),(28,'Precision Hydrometer','2025-12-17 10:09:27.694921'),(29,'Oil Gauging Tape','2025-12-17 10:09:45.199719'),(30,'SERVICES,CALIBRATION FOR MULTI GAS DETECTOR','2025-12-17 10:13:46.686678'),(31,'SERVICES,CALIBRATION OF FALL ARRESTOR','2025-12-17 10:13:46.889107'),(32,'SERVICES,CALIBRATION OF HYDRAULIC JACK PALLET TROLLY','2025-12-17 10:13:47.096721'),(33,'SERVICES,CALIBRATION OF POWER DP MULTI 110/220VOLTS (SECONDARY JB PVC)','2025-12-17 10:13:47.278762'),(34,'SERVICES,CALIBRATION OF MAIN POWER DISTRIBUTION POWER PANEL MULTI 110/220VOLTS','2025-12-17 10:13:47.454830'),(35,'SERVICES,CALIBRATION OF MULTIMETER FLUKE','2025-12-17 10:13:47.639274'),(36,'CALIBRATION,HART COMMUNICATOR','2025-12-17 10:13:47.853227'),(37,'SERVICES,CALIBRATION OF CLAMP MULTIMETER','2025-12-17 10:13:48.048403'),(38,'SERVICES,CALIBRATION OF AIR DISTRIBUTOR MANIFOLD','2025-12-17 10:13:48.227158'),(39,'SERVICES,CALIBRATION OF GENERATOR -50KVA','2025-12-17 10:13:48.408741'),(40,'CALIBRATION,DEW POINT METER','2025-12-17 10:13:48.598490'),(41,'CALIBRATION,FLOW METER (ARGON REGULATOR)','2025-12-17 10:13:48.788736'),(42,'CALIBRATION,HUMIDITY METER','2025-12-17 10:13:48.977411'),(43,'CALIBRATION,MONITOR WELD PURGE','2025-12-17 10:13:49.162219'),(44,'CALIBRATION,PRESSURE CALIBRATOR','2025-12-17 10:13:49.342057'),(45,'CALIBRATION,PRESSURE GAUGE UPTO 10000 PSI','2025-12-17 10:13:49.516470'),(46,'CALIBRATION,PRESSURE SAFETY RELIEF VALVE (VARIOUS RANGES)','2025-12-17 10:13:49.763319'),(47,'CALIBRATION,TORQUE WRENCH','2025-12-17 10:13:49.942076'),(48,'SERVICES,CALIBRATION ELECTRODE OVEN PORTABLE TYPE','2025-12-17 10:13:50.115642'),(49,'SERVICES,CALIBRATION ELECTRODE OVEN TEMPERATURE RANGE MORE THAN 200 DEG. C','2025-12-17 10:13:50.291311'),(50,'SERVICES,CALIBRATION OF CO2 REGULATOR','2025-12-17 10:13:50.501109'),(51,'SERVICES,CALIBRATION OF HI FREQUENCY WELDING MACHINE','2025-12-17 10:13:51.082438'),(52,'SERVICES,CALIBRATION OF HYDROTEST PUMP MANUAL','2025-12-17 10:13:51.326740'),(53,'SERVICES,CALIBRATION OF HYDROTEST PUMP PNEUMATIC','2025-12-17 10:13:51.527664'),(54,'SERVICES,CALIBRATION OF MANIFOLD 100 BAR','2025-12-17 10:13:52.101441'),(55,'SERVICES,CALIBRATION OF MANIFOLD 200 BAR','2025-12-17 10:13:52.781434'),(56,'SERVICES,CALIBRATION OF PRESSURE HOSE RANGE: 100 TO 350 BAR (VARIOUS LENGTH)','2025-12-17 10:13:52.966426'),(57,'SERVICES,CALIBRATION OF WELDING MACHINE DIESEL ENGINE','2025-12-17 10:13:53.154417'),(58,'SERVICES,CALIBRATION OF AIR COMPRESSOR ARAMCO STANDARD','2025-12-17 10:13:53.337681'),(59,'SERVICES,REFILLING & INSPECTION OF FIRE EXTINGUISHER,TYPE \"UL LISTED \" - 10 LBS','2025-12-17 10:13:53.511275'),(60,'SERVICES,REFILLING & INSPECTION OF FIRE EXTINGUISHER,TYPE \"UL LISTED \" - 20 LBS','2025-12-17 10:13:53.681922'),(61,'Fresh Water Analysis Report','2025-12-17 14:38:06.450637'),(62,'Water Analysis Certificate','2025-12-17 14:39:05.243141'),(63,'TUV Inspection for 10kv Generator','2025-12-20 09:16:55.030847'),(64,'TUV Inspection for Generator','2025-12-20 09:17:52.374395'),(65,'Open channel flume (tilting belt)-Magnetic Flowmeter  GUNT','2025-12-20 09:20:43.586400'),(66,'Head loss apparatus (local and friction)-Pressure  Transducers COMARK','2025-12-20 09:20:52.940112'),(67,'Bernoulli and Venturi demonstration apparatus GUNT','2025-12-20 09:21:01.120217'),(68,'Forced vortex apparatus GUNT','2025-12-20 09:21:10.021509'),(69,'Impact jet apparatus GUNT','2025-12-20 09:21:18.757045'),(70,'Demonstration of Archimedes principle GUNT','2025-12-20 09:21:27.719970'),(71,'Basic hydraulic bench GUNT','2025-12-20 09:21:36.342454'),(72,'Series/Parallel Pumps-Pressure Gauges','2025-12-20 09:21:43.406658'),(73,'Orifice apparatus ESSOM','2025-12-20 09:21:56.058957'),(74,'Hydrostatic pressure apparatus','2025-12-20 09:22:05.901822'),(75,'Heat Stress Meter','2025-12-20 09:40:17.638032'),(76,'Multi Gas Detector','2025-12-20 09:40:29.321827'),(77,'Single Gas Detector','2025-12-20 09:40:41.370142'),(78,'Air Compressor','2025-12-20 09:43:12.074264'),(79,'Air Quality Analysis (Air Compressor)','2025-12-20 09:43:12.385650'),(80,'Air Filter','2025-12-20 09:43:12.694832'),(81,'Airless Machine','2025-12-20 09:43:13.175968'),(82,'Blasting Pot','2025-12-20 09:43:13.640520'),(83,'Cable Detector','2025-12-20 09:43:14.041737'),(84,'Bow Shackle 8 1/2 t','2025-12-20 09:43:14.433397'),(85,'CO Monitor','2025-12-20 09:43:14.727185'),(86,'Casing Elevator','2025-12-20 09:43:15.091690'),(87,'CHAIN HOIST','2025-12-20 09:43:15.453248'),(88,'Fusion Welding Machine','2025-12-20 09:43:15.761686'),(89,'Compound Gauge','2025-12-20 09:43:16.075301'),(90,'Extrusion Welder','2025-12-20 09:43:16.790733'),(91,'Generator','2025-12-20 09:43:17.098505'),(92,'Grinding Machine','2025-12-20 09:43:17.378002'),(93,'Hydrotest of Hose 4\"','2025-12-20 09:43:17.711712'),(94,'Insulation Tester','2025-12-20 09:43:18.039581'),(95,'Leak Tester ( Pressure Gauge)','2025-12-20 09:43:18.356213'),(96,'Hydrotest of Hose 6\"','2025-12-20 09:43:18.637555'),(97,'Portable Oven','2025-12-20 09:43:18.915171'),(98,'Plate Compactor','2025-12-20 09:43:19.187156'),(99,'Pencil Grinding machine','2025-12-20 09:43:19.467701'),(100,'Pressure Relief Valve (5906 Psi)','2025-12-20 09:43:19.759052'),(101,'Pressure Relief Valve (6300 Psi)','2025-12-20 09:43:20.036184'),(102,'Pressure Relief Valve (1450 Psi)','2025-12-20 09:43:20.342263'),(103,'Pressure Relief Valve (1175 Psi)','2025-12-20 09:43:20.693656'),(104,'Pressure Relief Valve (4425 Psi)','2025-12-20 09:43:20.981217'),(105,'Pressure Relief Valve (5250 Psi)','2025-12-20 09:43:21.271387'),(106,'Pressure Relief Valve (3925 Psi)','2025-12-20 09:43:21.565271'),(107,'Pressure Relief Valve (5775 Psi)','2025-12-20 09:43:21.910017'),(108,'Psychrometer','2025-12-20 09:43:22.180916'),(109,'Thermohygrometer','2025-12-20 09:43:22.529292'),(110,'Vaccum Gauge','2025-12-20 09:43:22.826841'),(111,'Sling Belt','2025-12-20 09:43:23.126168'),(112,'Welding Machine','2025-12-20 09:43:23.474947'),(113,'WEBBING  SLINGS','2025-12-20 09:43:23.853316'),(114,'Level Machine SOKIA','2025-12-20 09:43:24.158156'),(115,'Total Station SOKIA','2025-12-20 09:43:24.451372'),(116,'HDPE Welding Machine LISTER ( GEOSTAR – G7 )','2025-12-20 09:43:24.769486'),(117,'Calibration Service for External Taper Gauge','2025-12-20 09:46:33.254682'),(118,'Calibration Service for Internal Taper Gauge','2025-12-20 09:46:33.538200'),(119,'Calibration Service for Lead Gauge','2025-12-20 09:46:34.135036'),(120,'Calibration Service for Hardness Test Block – 301 HBW','2025-12-20 09:46:34.433264'),(121,'Calibration Service for Hardness Test Block – 221 HBW','2025-12-20 09:46:34.716694'),(122,'Calibration Service for Depth Micrometer','2025-12-20 09:46:34.992962'),(123,'Calibration Service for OD Micrometer','2025-12-20 09:46:35.284601'),(124,'Calibration Service for Hydraulic Brinell Hardness Tester','2025-12-20 09:46:35.576926'),(125,'Calibration Service for ID Micrometer','2025-12-20 09:46:35.860709'),(126,'Calibration Service for External Thread Height Gauge','2025-12-20 09:46:36.161777'),(127,'Calibration Service for Digital Vernier Caliper','2025-12-20 09:46:36.462084'),(128,'Gantry Frame – SWL/WLL 5 Ton','2025-12-20 09:49:24.718664'),(129,'Forklift – YALE ERP50VM','2025-12-20 09:49:25.004877'),(130,'Chain Block – Hook Suspended, SWL/WLL Random','2025-12-20 09:49:25.282505'),(131,'Wide Flange Beam Clamp – ENFROE Jaw Size 2\"-6\" (51–152mm)','2025-12-20 09:49:25.556049'),(132,'Vertical Plate Clamp','2025-12-20 09:49:25.833679'),(133,'Duplex Hand Grip with Eye Nut','2025-12-20 09:49:26.109889'),(134,'Pallet Truck – Capacity 2,500 KG','2025-12-20 09:49:26.393499'),(135,'Fiber/Web Sling – 2.5 Meter','2025-12-20 09:49:26.675269'),(136,'Fiber/Web Sling – 2 Meter','2025-12-20 09:49:26.956038'),(137,'Fiber/Web Sling – 1 Meter','2025-12-20 09:49:27.274314'),(138,'Wire Sling with Thimble – 13 mm','2025-12-20 09:49:27.551849'),(139,'Wire Sling with Thimble – 13 mm (Soft Eye)','2025-12-20 09:49:27.844343'),(140,'Wire Sling with Thimble – 20 mm (Soft Eye)','2025-12-20 09:49:28.134349'),(141,'Chain Sling with Hook – 1 Meter','2025-12-20 09:49:28.453912'),(142,'Chain Sling with Hook – 2 Meter','2025-12-20 09:49:28.773348'),(143,'Eye Bolt – 24 mm','2025-12-20 09:49:29.069608'),(144,'Eye Bolt – 20 mm','2025-12-20 09:49:29.346357'),(145,'Eye Bolt – 16 mm','2025-12-20 09:49:29.637532'),(146,'Eye Bolt – 12 mm','2025-12-20 09:49:29.924007'),(147,'Eye Bolt – 10 mm','2025-12-20 09:49:30.211750'),(148,'Eye Bolt – 8 mm','2025-12-20 09:49:30.492436'),(149,'Eye Bolt – 7 mm','2025-12-20 09:49:30.774198'),(150,'Eye Bolt – 6 mm','2025-12-20 09:49:31.065801'),(151,'Eye Bolt – 1/4 inch','2025-12-20 09:49:31.356826'),(152,'Eye Bolt with Shoulder – 5/8 inch','2025-12-20 09:49:31.653843'),(153,'Shackle – 5/8 inch','2025-12-20 09:49:31.939533'),(154,'Shackle – 3/4 inch','2025-12-20 09:49:32.212439'),(155,'Shackle – 2 Ton, 1/2 inch','2025-12-20 09:49:32.503365'),(156,'Shackle – 4 Ton, 1/2 inch','2025-12-20 09:49:32.789324'),(157,'Shackle – 3/8 inch','2025-12-20 09:49:33.064340'),(158,'Shackle – 1/4 inch','2025-12-20 09:49:33.343358'),(159,'Engine Crane – APT, Capacity 1 Ton','2025-12-20 09:49:33.620546'),(160,'Digital Pressure Gauge','2025-12-21 07:17:58.272787'),(161,'Pressure Relief Valve','2025-12-21 07:17:58.623021'),(162,'Torque Wrench','2025-12-21 07:17:58.954904'),(163,'Chart Recorder','2025-12-21 07:17:59.251434'),(164,'Micro OHM Meter','2025-12-21 07:17:59.581446'),(165,'Time Domain Reflectometer','2025-12-21 07:17:59.864981'),(166,'Thermohygrometer (rejected)','2025-12-21 07:18:00.208791'),(167,'PRV (rejected)','2025-12-21 07:18:00.608702'),(168,'Admixture 1 Scale','2025-12-21 12:28:36.253506'),(169,'Admixture 2 Scale','2025-12-21 12:28:45.045731'),(170,'Water Scale','2025-12-21 12:28:54.044488'),(171,'Cement Scale','2025-12-21 12:29:02.111772'),(172,'Aggregate Scale','2025-12-21 12:29:10.708040'),(173,'Ice Scale','2025-12-21 12:29:20.848012'),(174,'Micro Silica Scale','2025-12-21 12:29:29.769372'),(175,'Total Station','2025-12-21 12:32:42.855710'),(176,'Digital Thermo Hygrometer','2025-12-21 12:32:52.838815'),(177,'Automatic Level','2025-12-21 12:33:01.969358'),(178,'9999 High pressure Grouting machine','2025-12-21 12:33:11.390075'),(179,'Digital Thermometer','2025-12-21 12:33:42.817368'),(180,'Coating Thickness Gauge','2025-12-21 12:33:59.278093'),(181,'Weighing Balance','2025-12-22 09:43:17.590217'),(182,'Weighing Scale','2025-12-22 09:43:34.457929'),(183,'Crane Scale','2025-12-22 09:43:43.595018'),(184,'Sphygmomanometer','2025-12-22 09:43:51.990182'),(185,'Tango TX-1 Gas detector(Brand new) One year','2025-12-25 07:16:10.750870'),(186,'Ambient AC','2025-12-25 07:18:53.729937'),(187,'Chiller Evaporator','2025-12-25 07:19:02.639954'),(188,'Freezer Evaporator','2025-12-25 07:19:11.335923'),(189,'Truck Cooling Units','2025-12-25 07:19:23.602238'),(190,'Thermometer','2025-12-25 07:19:32.068686'),(191,'Ambient Evaporator','2025-12-25 07:22:06.414038'),(192,'Air Compressor Screw Type','2025-12-25 07:26:18.288264'),(193,'Air Receiver Tank','2025-12-25 07:26:37.370304'),(194,'Blasting Port','2025-12-25 07:26:51.493020'),(195,'Painting Equipment','2025-12-25 07:27:02.398055'),(196,'Sand Blasting Pot','2025-12-25 07:31:41.499109'),(197,'After Cooler','2025-12-25 07:32:21.138728'),(198,'Airless Spray Machine','2025-12-25 07:32:31.598683'),(199,'PRV','2025-12-25 07:33:05.164039'),(200,'Hoses','2025-12-25 07:33:20.099599'),(201,'Hydrotest','2025-12-25 07:33:43.620104'),(202,'Hydraulic Jack','2025-12-25 07:47:46.432326'),(203,'Hydraulic Jack (Hollow)','2025-12-25 07:48:13.851622'),(204,'Hydraulic Pump for Jack','2025-12-25 07:48:21.398397'),(205,'Air Manifold','2025-12-25 07:48:28.457472'),(206,'External Thread Height Gage (0-0.25) Inch (Gauge Maker)','2025-12-25 08:04:42.291177'),(207,'Outside Micrometer (Insize)','2025-12-25 08:04:42.568340'),(208,'Internal Pitch Diameter Gage (Guage Maker)','2025-12-25 08:04:42.842685'),(209,'External Pitch Diameter Gage (6-12\") (Gauge Maker)','2025-12-25 08:04:43.147546'),(210,'Pressure Test Bench (ESI)','2025-12-25 08:04:43.445851'),(211,'Pressure Transducer (Sensor)','2025-12-25 08:04:43.767980'),(212,'Digital Vernier Caliper (Insize)','2025-12-25 08:04:44.368425'),(213,'Three Points Internal Micrometer 3227-E065(Insize)','2025-12-25 08:04:44.685650'),(214,'Three Points Internal Micrometer 3227-E08(Insize)','2025-12-25 08:04:44.990117'),(215,'Three Points Internal Micrometer 3227-E05(Insize)','2025-12-25 08:04:45.268629'),(216,'3/8-16UNC-2B (4131-3C1)(Insize)','2025-12-25 08:04:45.719148'),(217,'Three Point Internal Micrometer 8-9\"(Insize)','2025-12-25 08:04:46.016689'),(218,'Sprit Level  (Vertex)','2025-12-25 08:04:46.632522'),(219,'RTG Venier Caliper (Insize)','2025-12-25 08:04:47.037143'),(220,'Thread Plug gauge-M6X1','2025-12-25 08:04:47.333664'),(221,'Thread Plug gauge-M8X1.25','2025-12-25 08:04:47.667689'),(222,'Thread Plug gauge-M10X1','2025-12-25 08:04:47.968318'),(223,'Gas Detector','2025-12-25 08:25:15.811178'),(224,'Takreer-4 Vacuum valve inspection and calibration','2025-12-25 08:26:54.010193'),(225,'JCB 18v Cordless Angle Grinder','2025-12-25 08:30:34.759887'),(226,'JCB 18v Brushless Impact Driver','2025-12-25 08:30:43.069975'),(227,'Voltage Continuity Tester','2025-12-25 08:30:53.515991'),(228,'Fluke Networks Micro scanner Cable Verifier','2025-12-25 08:31:02.052750'),(229,'Analog Pressure Gauge','2025-12-25 08:35:40.300358'),(230,'1\" Test Manifold - 7500psi','2025-12-25 08:35:40.583263'),(231,'2\" Y-Manifold - 500psi','2025-12-25 08:35:40.863998'),(232,'4\" Strainer Manifold - 300psi','2025-12-25 08:35:41.134482'),(233,'6\" Strainer Manifold - 300psi','2025-12-25 08:35:41.415485'),(234,'1/2\" Hose','2025-12-25 08:35:41.713421'),(235,'1\" Hose','2025-12-25 08:35:41.997474'),(236,'2\" Hose','2025-12-25 08:35:42.285252'),(237,'4\" Hose','2025-12-25 08:35:42.569146'),(238,'1\" Ball Valve - NPT','2025-12-25 08:35:42.870974'),(239,'2\" Ball Valve -NPT','2025-12-25 08:35:43.173450'),(240,'2\" Gate Valve - Flange','2025-12-25 08:35:43.473426'),(241,'3\" Gate Valve - Flange','2025-12-25 08:35:43.764059'),(242,'4\" Gate Valve - Flange','2025-12-25 08:35:44.052093'),(243,'6\" Gate Valve - Flange','2025-12-25 08:35:44.343507'),(244,'Spool Testing - Witness Only','2025-12-25 08:35:44.622477'),(245,'1/2\" Analog Flow meter','2025-12-25 08:35:44.903394'),(246,'1\" Digital Flow meter','2025-12-25 08:35:45.184899'),(247,'2\" Digital Flow Meter','2025-12-25 08:35:45.470332'),(248,'4\" Flow meter - Flange','2025-12-25 08:35:45.770494'),(249,'6\" Flow meter - Flange','2025-12-25 08:35:46.065809'),(250,'Dew Point Meter','2025-12-25 08:35:46.364320'),(251,'H2s Detector','2025-12-25 08:35:46.657690'),(252,'Oxygen Analyzer','2025-12-25 08:35:46.968043'),(253,'Pressure Recorder','2025-12-25 08:35:47.254201'),(254,'Temperature Recorder','2025-12-25 08:35:47.544340'),(255,'Torquing Wrench','2025-12-25 08:35:47.878456'),(256,'Differential Pressure transmitter','2025-12-27 10:26:48.928227'),(257,'IR Test','2025-12-27 10:26:49.234545'),(258,'Pressure Tem Chart Recorder','2025-12-27 10:26:49.528084'),(259,'Diesel Generator','2025-12-27 10:29:49.947646'),(260,'Salt Contamination water','2025-12-27 10:29:50.248284'),(261,'Holiday Detector','2025-12-27 10:29:50.591360'),(262,'Hose','2025-12-27 10:29:50.913045'),(263,'Surface cleaner','2025-12-27 10:29:51.218127'),(264,'Atmospheric vapurization unit load test','2025-12-27 10:29:51.583058'),(265,'Atmospheric vapurization unit mpi test','2025-12-27 10:29:51.880324'),(266,'Pressure Gauge, 2.5\" {63 mm} dial, AISI 304SS case, ¼\" NPT Back connection, Brass wetted parts, Range: 0-160 psi/0 - 11 Bar, Order Code: PFQ905R1R11C-SE','2025-12-27 10:32:27.174128'),(267,'Pressure Gauge, 2.5\" {63 mm} dial, AISI 304SS case, ¼\" NPT Back connection, Brass wetted parts, Range: 0-100 psi/0 - 7 Bar, Order Code: PFQ904R1R11C-SE','2025-12-27 10:32:27.480305'),(268,'Pressure Gauge, 2.5\" {63 mm} dial, AISI 304SS case, ¼\" NPT Back connection, Brass wetted parts, Range:0-6,000 psi/0 - 400 Bar, Order Code: PFQ915R1R11C-SE','2025-12-27 10:32:27.780805'),(269,'Pressure Gauge, 2.5\" {63 mm} dial  , AISI 304SS case, ¼\" NPT Back connection, Brass wetted parts, Range:  0-200 psi/0 - 14 Bar, Order Code: PFQ906R1R11C-SE','2025-12-27 10:32:28.093511'),(270,'Pressure Gauge, 2.5\" {63 mm} dial  , AISI 304SS case, ¼\" NPT Bottom connection, Brass wetted parts, Range:  0-200 psi/0 - 14 Bar, Order Code: PFQ806R1R11C-SE','2025-12-27 10:32:28.411187'),(271,'High  Pressure Hose','2025-12-29 07:29:10.837278'),(272,'Cryogenic Hoses','2025-12-29 07:29:18.359280'),(273,'Breathing Apparatus (Refill and inspection)','2025-12-29 07:29:25.416201'),(274,'Pressure Transmitter','2025-12-29 12:40:54.431360'),(275,'Magnifier','2025-12-29 12:40:59.660850'),(276,'Simulation Panel','2025-12-29 12:41:30.681283'),(277,'IR Test Report','2025-12-29 12:41:36.925723'),(278,'kitchen scale','2025-12-30 06:54:36.866144'),(279,'testr','2025-12-30 07:25:17.096051'),(280,'test pressure','2025-12-30 09:21:47.247130'),(281,'High Pressure Hose','2026-01-04 06:02:06.048185'),(282,'Multimeter','2026-01-04 06:02:38.785898'),(283,'Pressure Gauge, 2.5\" {63 mm} dial, AISI 304SS case, ¼\" NPT  Back connection, Brass wetted parts, Range: 0-160 psi/0 - 11  Bar, Order Code: PFQ905R1R11C-SE','2026-01-04 06:06:33.853674'),(284,'Pressure Gauge, 2.5\" {63 mm} dial, AISI 304SS case, ¼\" NPT  Back connection, Brass wetted parts, Range: 0-100 psi/0 - 7 Bar,  Order Code: PFQ904R1R11C-SE','2026-01-04 06:06:54.136977'),(285,'Pressure Gauge, 2.5\" {63 mm} dial, AISI 304SS case, ¼\" NPT  Back connection, Brass wetted parts, Range:0-6,000 psi/0 - 400  Bar, Order Code: PFQ915R1R11C-SE','2026-01-04 06:07:02.973503'),(286,'Pressure Gauge, 2.5\" {63 mm} dial  , AISI 304SS case, ¼\" NPT  Back connection, Brass wetted parts, Range:  0-200 psi/0 - 14  Bar, Order Code: PFQ906R1R11C-SE','2026-01-04 06:07:10.634810'),(287,'Pressure Gauge, 2.5\" {63 mm} dial  , AISI 304SS case, ¼\" NPT  Bottom connection, Brass wetted parts, Range:  0-200 psi/0 - 14  Bar, Order Code: PFQ806R1R11C-SE','2026-01-04 06:07:19.641167'),(288,'Thermocouple type K - 1','2026-01-04 06:15:32.302230'),(289,'Thermocouple type K - 2','2026-01-04 06:15:32.615069'),(290,'Thermocouple type K - 3','2026-01-04 06:15:32.913041'),(291,'Thermocouple type K - 4','2026-01-04 06:15:33.261314'),(292,'Thermocouple type K - 5','2026-01-04 06:15:33.569522'),(293,'Thermocouple type K - 6','2026-01-04 06:15:34.110167'),(294,'Thermocouple type K - 7','2026-01-04 06:15:34.520853'),(295,'Thermocouple type K - 8','2026-01-04 06:15:34.853582'),(296,'Thermocouple type K - 9','2026-01-04 06:15:35.191333'),(297,'Thermocouple type K - 10','2026-01-04 06:15:35.482203'),(298,'Thermocouple type K - 11','2026-01-04 06:15:35.802319'),(299,'Thermocouple type K - 12','2026-01-04 06:15:36.181174'),(300,'Thermocouple type K - 13','2026-01-04 06:15:36.482250'),(301,'Thermocouple type K - 14','2026-01-04 06:15:36.914976'),(302,'Thermocouple type K - 15','2026-01-04 06:15:37.218070'),(303,'Thermocouple type K - 16','2026-01-04 06:15:37.509178'),(304,'Thermocouple type K - 17','2026-01-04 06:15:37.792897'),(305,'Thermocouple type K - 18','2026-01-04 06:15:38.068622'),(306,'Differential Pressure Transmitter - 1','2026-01-04 06:15:38.358084'),(307,'Differential Pressure Transmitter - 2','2026-01-04 06:15:38.643825'),(308,'Differential Pressure Transmitter - 3','2026-01-04 06:15:38.966323'),(309,'Vernier Caliper (0–300 mm)','2026-01-04 06:15:39.279029'),(310,'Digital Micrometer','2026-01-04 06:15:39.663735'),(311,'calibration for dew point gauge','2026-01-04 06:20:55.367020'),(312,'calibration for surface profile gauge','2026-01-04 06:20:55.649813'),(313,'calibration for salt contamination meter','2026-01-04 06:20:56.011571'),(314,'methyl ethyl ketone (MEK) 3Liters/gallon','2026-01-04 06:20:56.402771'),(315,'magnetic stirrer','2026-01-04 06:20:56.696437'),(316,'calibration for brochure Gauge','2026-01-04 06:20:56.975267'),(317,'Dial Thickness gauge (elcometer)','2026-01-04 06:20:57.315246'),(318,'long caliper (0-600mm)','2026-01-04 06:20:57.620676'),(319,'digital height gauge (0-300mm)','2026-01-04 06:20:57.977735'),(320,'digital angle gauge / protractor','2026-01-04 06:20:58.531390'),(321,'depth gauge (for slots,holes thread depth)','2026-01-04 06:20:58.847723'),(322,'granite surface plate','2026-01-04 06:20:59.140186'),(323,'combination square','2026-01-04 06:20:59.466104'),(324,'contour gauge (for bent profile replication)','2026-01-04 06:20:59.837226'),(325,'go/no-go thread plug gauge','2026-01-04 06:21:00.183078'),(326,'thread depth gauge','2026-01-04 06:21:00.468745'),(327,'Asphalt Cutter','2026-01-04 06:22:56.952553'),(328,'Gas Detectors (BW)','2026-01-04 06:24:17.157448'),(329,'Harness','2026-01-04 06:24:24.956547'),(330,'Spray Machine','2026-01-04 08:16:11.242813'),(331,'Durometer Shore M type','2026-01-04 08:31:51.094867'),(332,'Elco meter','2026-01-04 08:31:59.490489'),(333,'Tango Gas Detector','2026-01-04 08:33:46.106428'),(334,'Infrared Thermometer','2026-01-04 08:52:23.676874'),(335,'DIGITAL TACHOMETER','2026-01-04 08:52:23.979447'),(336,'RIGHT ANGLE RULER','2026-01-04 08:52:24.296121'),(337,'Angle Meter','2026-01-04 08:52:24.694820'),(338,'Measuring tape 25\'','2026-01-04 08:52:25.016277'),(339,'Measuring tape 3/10\'','2026-01-04 08:52:25.408828'),(340,'OUTSIDE MICROMETER 50-75mm','2026-01-04 08:52:25.692039'),(341,'OUTSIDE MICROMETER 25-50mm','2026-01-04 08:52:26.040530'),(342,'OUTSIDE MICROMETER 75-100mm','2026-01-04 08:52:26.447468'),(343,'OUTSIDE MICROMETER 125-150mm','2026-01-04 08:52:26.749007'),(344,'Digital Vernier Caliper 0-150','2026-01-04 08:52:27.061168'),(345,'Digital Vernier Caliper 0-300 mm','2026-01-04 08:52:27.470109'),(346,'DIAL BORE GAURE 0.01mm/ 35-60mm','2026-01-04 08:52:27.767657'),(347,'DIAL BORE GAURE (50-160mm)','2026-01-04 08:52:28.109722'),(348,'THREAD PROFILE GAUGE','2026-01-04 08:52:28.450652'),(349,'HEIGHT GAUGE','2026-01-04 08:52:28.746697'),(350,'PROTRACTOR','2026-01-04 08:52:29.123969'),(351,'Universal Protractor 0-360','2026-01-04 08:52:29.435494'),(352,'Depth Gauge','2026-01-04 08:52:29.814065'),(353,'Dry film  thickness gauge','2026-01-04 08:52:30.101539'),(354,'Coating thickness tester','2026-01-04 08:52:30.436228'),(355,'Elcometer surface profile gauge','2026-01-04 08:52:30.744236'),(356,'Elcometer Dew Point meter','2026-01-04 08:52:31.052117'),(357,'Pressure Gauge-Digital Adhesion Tester Kit','2026-01-04 08:52:31.467618'),(358,'Elcometer Salt test kit','2026-01-04 08:52:31.865891'),(359,'Hygro-Thermometer (Big Digit), painting booth','2026-01-04 08:52:32.188300'),(360,'Hygro-Thermometer (Big Digit), blasting booth','2026-01-04 08:52:32.499661'),(361,'Hygro-Thermometer (Big Digit)','2026-01-04 08:52:32.791847'),(362,'Clamp meter','2026-01-04 08:52:33.079256'),(363,'Hydraulic pressure gauge 250 bars','2026-01-04 08:52:33.419531'),(364,'Hydraulic pressur gauge 1600 bars','2026-01-04 08:52:33.815967'),(365,'Filter Regulator Lubricator Pressure Gauge  (0-16 Bar/ 0-200)','2026-01-04 08:52:34.226622'),(366,'Pressure Gauge Breathing Air Filters#1','2026-01-04 08:52:34.524989'),(367,'AC pressure Gauge,  {0-500psi}','2026-01-04 08:52:34.837631'),(368,'AC pressure Gauge, {0-120psi}','2026-01-04 08:52:35.157739'),(369,'Pressure Gauge on compressor ACO002, Blasting','2026-01-04 08:52:35.553745'),(370,'Dial gauge 0.001\"','2026-01-04 08:52:35.858229'),(371,'Pressure Gauge Breathing Air Filters#2  (0-10 bar)','2026-01-04 08:52:36.170012'),(372,'Needle pressure guage (0-11 bar) (0-160 psi)','2026-01-04 08:52:36.588815'),(373,'Reduced Pressure Gauge, Airless Spray machine (0-250 psi)','2026-01-04 08:52:36.883055'),(374,'Calibration for Insulation Tester','2026-01-04 08:53:59.854251'),(375,'Kestrel 550 weather meter, 1 year','2026-01-04 09:02:59.595796'),(376,'Multi functions CCTV tester, 1 year','2026-01-04 09:03:08.597833'),(377,'Network cable tester (see picture), 1 year','2026-01-04 09:03:17.880039'),(378,'Drill Auger (BOBCAT)','2026-01-04 09:05:09.454715'),(379,'Air Quality','2026-01-04 09:08:06.277256'),(380,'Painting Machine','2026-01-04 09:08:06.645752'),(381,'Multi Gas Detector Oxygen Sensor Replacement','2026-01-04 09:11:27.023839'),(382,'Calibration of Multi Gas Detector','2026-01-04 09:11:36.502345'),(383,'Lever Hoist','2026-01-04 09:33:50.477242'),(384,'CERTIFICATION FW ANALYSIS','2026-01-05 12:20:58.815176'),(385,'Fresh water Analysis','2026-01-05 12:21:53.481213'),(386,'Calibration of Digital Hygro Thermometer','2026-01-05 12:28:32.626177'),(387,'CNC Lathe','2026-01-05 12:30:26.856802'),(388,'IBIX Pot','2026-01-06 12:49:32.902732'),(389,'Remote sealed pressure transmitters Calibration and certificate','2026-01-12 07:05:29.924460'),(390,'Pressure transmitters Calibration and certificate','2026-01-12 07:05:30.204840'),(391,'Remote sealed differential pressure transmitter Calibration & certificate','2026-01-12 07:05:30.490823'),(392,'Differential pressure transmitters Calibration and certificate','2026-01-12 07:05:30.765002'),(393,'Differential pressure type flow meters Calibration and certificate','2026-01-12 07:05:31.043214'),(394,'Thermal mass flow meter flow meter Calibration and certificate','2026-01-12 07:05:31.325887'),(395,'RADAR Level Transmitter Calibration and certificate','2026-01-12 07:05:31.650080'),(396,'Ultrasonic Level transmitters Calibration and certificate','2026-01-12 07:05:32.015322'),(397,'Capacitance Level transmitters Calibration and certificate','2026-01-12 07:05:32.291165'),(398,'Differential pressure type Level transmitters Calibration and certificate','2026-01-12 07:05:32.590338'),(399,'Dry/wet/Bubbler level transmitter Calibration and certificate','2026-01-12 07:05:32.863005'),(400,'Float/Displacer level transmitter Calibration and certificate','2026-01-12 07:05:33.136911'),(401,'Radiation based level transmitter Calibration and certificate','2026-01-12 07:05:33.410536'),(402,'Nuclear level transmitter Calibration and certificate','2026-01-12 07:05:33.688624'),(403,'Temperature transmitters Calibration and certificate','2026-01-12 07:05:33.956927'),(404,'Multivariable transmitters Calibration and certificate','2026-01-12 07:05:34.228392'),(405,'AIR HOSE 3/4\"','2026-01-12 07:13:15.923454'),(406,'GUNNING HOSE 1.5\"','2026-01-12 07:13:16.192077'),(407,'GUNNING AIR HOSE 2\"','2026-01-12 07:13:16.459096'),(408,'NEEDLE THERMOMETER','2026-01-12 07:13:16.741939'),(409,'PNEUMATIC GUNNING MACHINE','2026-01-12 07:13:17.026039'),(410,'WATER PUMP','2026-01-12 07:13:17.299217'),(411,'CONCRETE MIXER MACHINE','2026-01-12 07:13:17.576781'),(412,'Concrete air meter','2026-01-12 07:15:25.231899'),(413,'calibration of melting pot','2026-01-12 07:15:25.524366'),(414,'calibration of plate load pump with jack','2026-01-12 07:15:25.805512'),(415,'calibration of slump cone set','2026-01-12 07:15:26.093494'),(416,'Dial Indicator','2026-01-12 07:25:12.220478'),(417,'Caliper (Digital)','2026-01-12 07:25:12.507790'),(418,'King Portable Hardness Tester/ Microscope','2026-01-12 07:25:13.348639'),(419,'Surface Rougness Specimens','2026-01-12 07:25:13.626082'),(420,'Dial Indicator (Needle Type)','2026-01-12 07:25:13.917426'),(421,'Bevel Protractor','2026-01-12 07:25:14.228472'),(422,'External Micrometer(Digital)','2026-01-12 07:25:14.795252'),(423,'External Micrometer','2026-01-12 07:25:15.349031'),(424,'Internal Micrometre','2026-01-12 07:25:15.668285'),(425,'Dial Indicator (Plunger Type)','2026-01-12 07:25:15.963190'),(426,'Three point Holtest micrometer','2026-01-12 07:25:16.540162'),(427,'Durometer shore A (0-100)','2026-01-12 07:25:18.553338'),(428,'Durometer shore D (0-100)','2026-01-12 07:25:18.841403'),(429,'Surface roughness tester c/w roughness specimen','2026-01-12 07:25:19.125911'),(430,'Digimatic Height Gauge','2026-01-12 07:25:19.412342'),(431,'Chemical Hose','2026-01-12 07:29:25.883571'),(432,'Needle Pressure Gauge','2026-01-12 07:29:26.163373'),(433,'Dial Thickness Gauge','2026-01-12 07:29:26.434705'),(434,'Automatic Adhesion Tester','2026-01-12 07:29:26.703777'),(435,'AC Voltage Detector','2026-01-12 07:29:26.969177'),(436,'High Pressure Pump','2026-01-12 07:29:27.240583'),(437,'Calibration of Air Compressor Gauge','2026-01-12 07:31:01.241255'),(438,'Calibration of Oxygen Cylinder Gauge','2026-01-12 07:31:11.547593'),(439,'Calibration of Acetylene Cylinder Gauge','2026-01-12 07:31:20.463833'),(440,'Calibration of Glossmeter','2026-01-21 12:16:58.570825'),(441,'Calibration of Needle Pressure Gauge','2026-01-21 12:17:08.154491'),(442,'Digital Vernier Caliper','2026-01-21 12:20:15.889272'),(443,'Magnetic Angle Protractor','2026-01-21 12:20:36.836755'),(444,'Laser Measure Meter','2026-01-21 12:20:46.870211'),(445,'Measuring Tape','2026-01-21 12:20:57.339828'),(446,'Spirit Level','2026-01-21 12:21:07.338602'),(447,'Sheave Gauge','2026-01-21 12:21:15.316419'),(448,'LMS Load cell 55 Ton','2026-01-21 12:21:25.282620'),(449,'Salt Meter','2026-01-21 12:23:46.065069'),(450,'Thermoprobe','2026-01-21 12:25:59.353037'),(451,'CALIBRATION TESTING THERMO-HYGROMETER  TEMPERATURE','2026-01-21 12:28:21.051639'),(452,'CALIBRATION TESTING – PROBE THERMOMETER','2026-01-21 12:28:37.077122'),(453,'CALIBRATION TESTING FREEZER CONTAINER','2026-01-21 12:28:45.124104'),(454,'CALIBRATION TESTING CHILLER TEMPERATURE','2026-01-21 12:28:53.007196'),(455,'CALIBRATION TESTING N/A OIL MONITORING DEVICE','2026-01-21 12:29:02.065448'),(456,'CALIBRATION TESTING IR THERMOMETER TEMPERATURE','2026-01-21 12:29:10.658041'),(457,'Tape','2026-02-10 12:36:42.616342'),(458,'Temperature','2026-02-10 12:36:42.844779'),(459,'Hygrometer','2026-02-10 12:36:43.077513'),(460,'trial add item','2026-02-10 12:42:11.696501');
/*!40000 ALTER TABLE `item_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_execution_deliverynote`
--

DROP TABLE IF EXISTS `job_execution_deliverynote`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_execution_deliverynote` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `dn_number` varchar(50) DEFAULT NULL,
  `signed_delivery_note` varchar(100) DEFAULT NULL,
  `delivery_status` varchar(20) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `series_id` bigint DEFAULT NULL,
  `work_order_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `dn_number` (`dn_number`),
  KEY `job_execution_delive_work_order_id_460b9bc8_fk_job_execu` (`work_order_id`),
  KEY `job_execution_delive_series_id_dc390122_fk_series_nu` (`series_id`),
  CONSTRAINT `job_execution_delive_series_id_dc390122_fk_series_nu` FOREIGN KEY (`series_id`) REFERENCES `series_numberseries` (`id`),
  CONSTRAINT `job_execution_delive_work_order_id_460b9bc8_fk_job_execu` FOREIGN KEY (`work_order_id`) REFERENCES `job_execution_workorder` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_execution_deliverynote`
--

LOCK TABLES `job_execution_deliverynote` WRITE;
/*!40000 ALTER TABLE `job_execution_deliverynote` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_execution_deliverynote` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_execution_deliverynoteitem`
--

DROP TABLE IF EXISTS `job_execution_deliverynoteitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_execution_deliverynoteitem` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `range` varchar(100) DEFAULT NULL,
  `quantity` int unsigned DEFAULT NULL,
  `delivered_quantity` int unsigned DEFAULT NULL,
  `delivery_note_id` bigint NOT NULL,
  `item_id` bigint DEFAULT NULL,
  `uom_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `job_execution_delive_delivery_note_id_fa407f25_fk_job_execu` (`delivery_note_id`),
  KEY `job_execution_deliverynoteitem_item_id_dee385e2_fk_item_item_id` (`item_id`),
  KEY `job_execution_deliverynoteitem_uom_id_5f56f7c0_fk_unit_unit_id` (`uom_id`),
  CONSTRAINT `job_execution_delive_delivery_note_id_fa407f25_fk_job_execu` FOREIGN KEY (`delivery_note_id`) REFERENCES `job_execution_deliverynote` (`id`),
  CONSTRAINT `job_execution_deliverynoteitem_item_id_dee385e2_fk_item_item_id` FOREIGN KEY (`item_id`) REFERENCES `item_item` (`id`),
  CONSTRAINT `job_execution_deliverynoteitem_uom_id_5f56f7c0_fk_unit_unit_id` FOREIGN KEY (`uom_id`) REFERENCES `unit_unit` (`id`),
  CONSTRAINT `job_execution_deliverynoteitem_chk_1` CHECK ((`quantity` >= 0)),
  CONSTRAINT `job_execution_deliverynoteitem_chk_2` CHECK ((`delivered_quantity` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_execution_deliverynoteitem`
--

LOCK TABLES `job_execution_deliverynoteitem` WRITE;
/*!40000 ALTER TABLE `job_execution_deliverynoteitem` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_execution_deliverynoteitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_execution_deliverynoteitemcomponent`
--

DROP TABLE IF EXISTS `job_execution_deliverynoteitemcomponent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_execution_deliverynoteitemcomponent` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `component` varchar(100) NOT NULL,
  `value` varchar(200) NOT NULL,
  `delivery_note_item_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `job_execution_delive_delivery_note_item_i_602d21b4_fk_job_execu` (`delivery_note_item_id`),
  CONSTRAINT `job_execution_delive_delivery_note_item_i_602d21b4_fk_job_execu` FOREIGN KEY (`delivery_note_item_id`) REFERENCES `job_execution_deliverynoteitem` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_execution_deliverynoteitemcomponent`
--

LOCK TABLES `job_execution_deliverynoteitemcomponent` WRITE;
/*!40000 ALTER TABLE `job_execution_deliverynoteitemcomponent` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_execution_deliverynoteitemcomponent` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_execution_invoice`
--

DROP TABLE IF EXISTS `job_execution_invoice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_execution_invoice` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `invoice_status` varchar(20) DEFAULT NULL,
  `due_in_days` int DEFAULT NULL,
  `received_date` date DEFAULT NULL,
  `payment_reference_number` varchar(100) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `delivery_note_id` bigint DEFAULT NULL,
  `delivery_note_item_id` bigint DEFAULT NULL,
  `final_invoice_file` varchar(100) DEFAULT NULL,
  `processed_certificate_file` varchar(100) DEFAULT NULL,
  `remarks` longtext,
  `signed_invoice_file` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `job_execution_invoic_delivery_note_item_i_221679a7_fk_job_execu` (`delivery_note_item_id`),
  KEY `job_execution_invoic_delivery_note_id_ec15a591_fk_job_execu` (`delivery_note_id`),
  CONSTRAINT `job_execution_invoic_delivery_note_id_ec15a591_fk_job_execu` FOREIGN KEY (`delivery_note_id`) REFERENCES `job_execution_deliverynote` (`id`),
  CONSTRAINT `job_execution_invoic_delivery_note_item_i_221679a7_fk_job_execu` FOREIGN KEY (`delivery_note_item_id`) REFERENCES `job_execution_deliverynoteitem` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_execution_invoice`
--

LOCK TABLES `job_execution_invoice` WRITE;
/*!40000 ALTER TABLE `job_execution_invoice` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_execution_invoice` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_execution_workorder`
--

DROP TABLE IF EXISTS `job_execution_workorder`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_execution_workorder` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `wo_number` varchar(50) DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `date_received` date DEFAULT NULL,
  `expected_completion_date` date DEFAULT NULL,
  `onsite_or_lab` varchar(20) DEFAULT NULL,
  `site_location` longtext,
  `remarks` longtext,
  `created_at` datetime(6) NOT NULL,
  `manager_approval_status` varchar(20) NOT NULL,
  `decline_reason` longtext,
  `wo_type` varchar(10) DEFAULT NULL,
  `application_status` varchar(20) DEFAULT NULL,
  `created_by_id` bigint DEFAULT NULL,
  `purchase_order_id` bigint DEFAULT NULL,
  `quotation_id` bigint DEFAULT NULL,
  `invoice_delivery_note_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `wo_number` (`wo_number`),
  KEY `job_execution_workor_created_by_id_e04db1ae_fk_team_tech` (`created_by_id`),
  KEY `job_execution_workor_purchase_order_id_e22a2d91_fk_pre_job_p` (`purchase_order_id`),
  KEY `job_execution_workor_quotation_id_701e2bdb_fk_pre_job_q` (`quotation_id`),
  KEY `job_execution_workor_invoice_delivery_not_703f0d10_fk_job_execu` (`invoice_delivery_note_id`),
  CONSTRAINT `job_execution_workor_created_by_id_e04db1ae_fk_team_tech` FOREIGN KEY (`created_by_id`) REFERENCES `team_technician` (`id`),
  CONSTRAINT `job_execution_workor_invoice_delivery_not_703f0d10_fk_job_execu` FOREIGN KEY (`invoice_delivery_note_id`) REFERENCES `job_execution_deliverynote` (`id`),
  CONSTRAINT `job_execution_workor_purchase_order_id_e22a2d91_fk_pre_job_p` FOREIGN KEY (`purchase_order_id`) REFERENCES `pre_job_purchaseorder` (`id`),
  CONSTRAINT `job_execution_workor_quotation_id_701e2bdb_fk_pre_job_q` FOREIGN KEY (`quotation_id`) REFERENCES `pre_job_quotation` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_execution_workorder`
--

LOCK TABLES `job_execution_workorder` WRITE;
/*!40000 ALTER TABLE `job_execution_workorder` DISABLE KEYS */;
INSERT INTO `job_execution_workorder` VALUES (1,'WO-PRM-000001','Submitted','2026-01-05','2026-01-08','Lab','Dammam','confim','2026-01-07 07:18:12.148965','Pending',NULL,'Single',NULL,NULL,4,80,NULL),(2,'WO-PRM-000002','Submitted','2026-01-07','2026-01-07','Onsite','Dammam','Confirm','2026-01-07 07:18:59.878175','Pending',NULL,'Single',NULL,NULL,3,26,NULL);
/*!40000 ALTER TABLE `job_execution_workorder` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_execution_workorderitem`
--

DROP TABLE IF EXISTS `job_execution_workorderitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_execution_workorderitem` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `quantity` int unsigned DEFAULT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `range` varchar(100) DEFAULT NULL,
  `certificate_uut_label` varchar(100) DEFAULT NULL,
  `certificate_number` varchar(100) DEFAULT NULL,
  `calibration_date` date DEFAULT NULL,
  `calibration_due_date` date DEFAULT NULL,
  `uuc_serial_number` varchar(100) DEFAULT NULL,
  `certificate_file` varchar(100) DEFAULT NULL,
  `assigned_to_id` bigint DEFAULT NULL,
  `item_id` bigint DEFAULT NULL,
  `unit_id` bigint DEFAULT NULL,
  `work_order_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `job_execution_workor_assigned_to_id_31ef77c0_fk_team_tech` (`assigned_to_id`),
  KEY `job_execution_workorderitem_item_id_11f43574_fk_item_item_id` (`item_id`),
  KEY `job_execution_workorderitem_unit_id_2e2694ef_fk_unit_unit_id` (`unit_id`),
  KEY `job_execution_workor_work_order_id_a3a92302_fk_job_execu` (`work_order_id`),
  CONSTRAINT `job_execution_workor_assigned_to_id_31ef77c0_fk_team_tech` FOREIGN KEY (`assigned_to_id`) REFERENCES `team_technician` (`id`),
  CONSTRAINT `job_execution_workor_work_order_id_a3a92302_fk_job_execu` FOREIGN KEY (`work_order_id`) REFERENCES `job_execution_workorder` (`id`),
  CONSTRAINT `job_execution_workorderitem_item_id_11f43574_fk_item_item_id` FOREIGN KEY (`item_id`) REFERENCES `item_item` (`id`),
  CONSTRAINT `job_execution_workorderitem_unit_id_2e2694ef_fk_unit_unit_id` FOREIGN KEY (`unit_id`) REFERENCES `unit_unit` (`id`),
  CONSTRAINT `job_execution_workorderitem_chk_1` CHECK ((`quantity` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_execution_workorderitem`
--

LOCK TABLES `job_execution_workorderitem` WRITE;
/*!40000 ALTER TABLE `job_execution_workorderitem` DISABLE KEYS */;
INSERT INTO `job_execution_workorderitem` VALUES (1,1,65.00,NULL,NULL,NULL,NULL,NULL,NULL,'',2,386,2,1),(2,3,75.00,NULL,NULL,NULL,NULL,NULL,NULL,'',2,1,2,2),(3,1,100.00,NULL,NULL,NULL,NULL,NULL,NULL,'',2,181,2,2),(4,1,150.00,NULL,NULL,NULL,NULL,NULL,NULL,'',2,182,2,2),(5,2,150.00,NULL,NULL,NULL,NULL,NULL,NULL,'',2,183,2,2),(6,2,100.00,NULL,NULL,NULL,NULL,NULL,NULL,'',2,184,2,2);
/*!40000 ALTER TABLE `job_execution_workorderitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pre_job_purchaseorder`
--

DROP TABLE IF EXISTS `pre_job_purchaseorder`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pre_job_purchaseorder` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_type` varchar(20) NOT NULL,
  `client_po_number` varchar(100) DEFAULT NULL,
  `po_file` varchar(100) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `quotation_id` bigint NOT NULL,
  `series_number` varchar(50) DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `series_number` (`series_number`),
  KEY `pre_job_purchaseorde_quotation_id_afe16f2c_fk_pre_job_q` (`quotation_id`),
  CONSTRAINT `pre_job_purchaseorde_quotation_id_afe16f2c_fk_pre_job_q` FOREIGN KEY (`quotation_id`) REFERENCES `pre_job_quotation` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pre_job_purchaseorder`
--

LOCK TABLES `pre_job_purchaseorder` WRITE;
/*!40000 ALTER TABLE `pre_job_purchaseorder` DISABLE KEYS */;
INSERT INTO `pre_job_purchaseorder` VALUES (1,'full','PO4500289043','po_files/PO4500289043.pdf','2025-12-21 05:58:30.011151',8,'PO-PRIME-000001','Collected'),(2,'full','PO4500289078','po_files/PO4500289078.pdf','2025-12-22 08:48:33.533488',7,'PO-PRIME-000002','Pending'),(3,'full','PO 497 PRIME','po_files/PO_497_PRIME_INOVATION_REVISED.pdf','2025-12-28 05:58:19.277724',26,'PO-PRIME-000003','Completed'),(4,'full','PO-7193','po_files/PO-7193.pdf','2026-01-06 12:59:43.977444',80,'PO-PRIME-000004','Completed'),(5,'full','PO20260000015','po_files/PO20260000015_signed.pdf','2026-01-12 08:07:11.480385',89,'PO-PRIME-000005','Pending'),(6,'full','PO20260000015','po_files/PO20260000015_signed_D1vseax.pdf','2026-01-12 08:07:15.694015',89,'PO-PRIME-000006','Pending'),(7,'full','42041581','po_files/42041581.pdf','2026-01-12 08:10:59.112444',86,'PO-PRIME-000007','Pending'),(8,'full','42041609','po_files/42041609.pdf','2026-01-12 08:12:41.612051',83,'PO-PRIME-000008','Pending');
/*!40000 ALTER TABLE `pre_job_purchaseorder` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pre_job_purchaseorderitem`
--

DROP TABLE IF EXISTS `pre_job_purchaseorderitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pre_job_purchaseorderitem` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `quantity` int unsigned DEFAULT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `item_id` bigint DEFAULT NULL,
  `purchase_order_id` bigint NOT NULL,
  `unit_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pre_job_purchaseorderitem_item_id_79a9d49c_fk_item_item_id` (`item_id`),
  KEY `pre_job_purchaseorde_purchase_order_id_81c5d096_fk_pre_job_p` (`purchase_order_id`),
  KEY `pre_job_purchaseorderitem_unit_id_36c6c658_fk_unit_unit_id` (`unit_id`),
  CONSTRAINT `pre_job_purchaseorde_purchase_order_id_81c5d096_fk_pre_job_p` FOREIGN KEY (`purchase_order_id`) REFERENCES `pre_job_purchaseorder` (`id`),
  CONSTRAINT `pre_job_purchaseorderitem_item_id_79a9d49c_fk_item_item_id` FOREIGN KEY (`item_id`) REFERENCES `item_item` (`id`),
  CONSTRAINT `pre_job_purchaseorderitem_unit_id_36c6c658_fk_unit_unit_id` FOREIGN KEY (`unit_id`) REFERENCES `unit_unit` (`id`),
  CONSTRAINT `pre_job_purchaseorderitem_chk_1` CHECK ((`quantity` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=80 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pre_job_purchaseorderitem`
--

LOCK TABLES `pre_job_purchaseorderitem` WRITE;
/*!40000 ALTER TABLE `pre_job_purchaseorderitem` DISABLE KEYS */;
INSERT INTO `pre_job_purchaseorderitem` VALUES (1,1,850.00,62,1,2),(2,1,850.00,61,2,2),(3,3,75.00,1,3,2),(4,1,100.00,181,3,2),(5,1,150.00,182,3,2),(6,2,150.00,183,3,2),(7,2,100.00,184,3,2),(8,1,65.00,386,4,2),(9,1,100.00,416,5,2),(10,1,100.00,417,5,2),(11,1,100.00,417,5,2),(12,1,100.00,417,5,2),(13,1,250.00,418,5,2),(14,1,400.00,419,5,2),(15,1,100.00,420,5,2),(16,1,100.00,421,5,2),(17,1,100.00,417,5,2),(18,1,100.00,422,5,2),(19,1,100.00,422,5,2),(20,1,100.00,423,5,2),(21,1,100.00,424,5,2),(22,1,90.00,425,5,2),(23,1,100.00,420,5,2),(24,1,100.00,426,5,2),(25,1,100.00,426,5,2),(26,1,100.00,426,5,2),(27,1,100.00,426,5,2),(28,1,100.00,426,5,2),(29,1,100.00,426,5,2),(30,1,100.00,426,5,2),(31,1,250.00,427,5,2),(32,1,250.00,428,5,2),(33,1,400.00,429,5,2),(34,1,100.00,430,5,2),(35,1,100.00,417,5,2),(36,1,100.00,416,6,2),(37,1,100.00,417,6,2),(38,1,100.00,417,6,2),(39,1,100.00,417,6,2),(40,1,250.00,418,6,2),(41,1,400.00,419,6,2),(42,1,100.00,420,6,2),(43,1,100.00,421,6,2),(44,1,100.00,417,6,2),(45,1,100.00,422,6,2),(46,1,100.00,422,6,2),(47,1,100.00,423,6,2),(48,1,100.00,424,6,2),(49,1,90.00,425,6,2),(50,1,100.00,420,6,2),(51,1,100.00,426,6,2),(52,1,100.00,426,6,2),(53,1,100.00,426,6,2),(54,1,100.00,426,6,2),(55,1,100.00,426,6,2),(56,1,100.00,426,6,2),(57,1,100.00,426,6,2),(58,1,250.00,427,6,2),(59,1,250.00,428,6,2),(60,1,400.00,429,6,2),(61,1,100.00,430,6,2),(62,1,100.00,417,6,2),(63,6,75.00,405,7,2),(64,5,75.00,406,7,2),(65,5,75.00,407,7,2),(66,1,75.00,179,7,2),(67,1,75.00,408,7,2),(68,1,150.00,409,7,2),(69,1,125.00,410,7,2),(70,1,150.00,411,7,2),(71,2,100.00,82,8,2),(72,2,100.00,197,8,2),(73,1,200.00,201,8,2),(74,1,100.00,193,8,2),(75,5,65.00,1,8,2),(76,4,75.00,199,8,2),(77,8,75.00,200,8,2),(78,1,100.00,388,8,2),(79,2,100.00,330,8,2);
/*!40000 ALTER TABLE `pre_job_purchaseorderitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pre_job_quotation`
--

DROP TABLE IF EXISTS `pre_job_quotation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pre_job_quotation` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `company_name` varchar(100) DEFAULT NULL,
  `company_address` longtext,
  `company_phone` varchar(50) DEFAULT NULL,
  `company_email` varchar(254) DEFAULT NULL,
  `point_of_contact_name` varchar(100) DEFAULT NULL,
  `point_of_contact_email` varchar(254) DEFAULT NULL,
  `point_of_contact_phone` varchar(50) DEFAULT NULL,
  `due_date_for_quotation` date DEFAULT NULL,
  `quotation_status` varchar(20) NOT NULL,
  `next_followup_date` date DEFAULT NULL,
  `followup_frequency` varchar(20) NOT NULL,
  `remarks` longtext,
  `series_number` varchar(50) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `assigned_sales_person_id` bigint DEFAULT NULL,
  `rfq_id` bigint NOT NULL,
  `rfq_channel_id` bigint DEFAULT NULL,
  `not_approved_reason_remark` longtext,
  `email_sent` tinyint(1) DEFAULT NULL,
  `vat_applicable` tinyint(1) DEFAULT NULL,
  `terms_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `series_number` (`series_number`),
  KEY `pre_job_quotation_assigned_sales_perso_983aa816_fk_team_team` (`assigned_sales_person_id`),
  KEY `pre_job_quotation_rfq_id_4b285bdc_fk_pre_job_rfq_id` (`rfq_id`),
  KEY `pre_job_quotation_rfq_channel_id_072fd56b_fk_channels_` (`rfq_channel_id`),
  KEY `pre_job_quotation_terms_id_57f9bba8_fk_pre_job_quotationterms_id` (`terms_id`),
  CONSTRAINT `pre_job_quotation_assigned_sales_perso_983aa816_fk_team_team` FOREIGN KEY (`assigned_sales_person_id`) REFERENCES `team_teammember` (`id`),
  CONSTRAINT `pre_job_quotation_rfq_channel_id_072fd56b_fk_channels_` FOREIGN KEY (`rfq_channel_id`) REFERENCES `channels_rfqchannel` (`id`),
  CONSTRAINT `pre_job_quotation_rfq_id_4b285bdc_fk_pre_job_rfq_id` FOREIGN KEY (`rfq_id`) REFERENCES `pre_job_rfq` (`id`),
  CONSTRAINT `pre_job_quotation_terms_id_57f9bba8_fk_pre_job_quotationterms_id` FOREIGN KEY (`terms_id`) REFERENCES `pre_job_quotationterms` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=98 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pre_job_quotation`
--

LOCK TABLES `pre_job_quotation` WRITE;
/*!40000 ALTER TABLE `pre_job_quotation` DISABLE KEYS */;
INSERT INTO `pre_job_quotation` VALUES (5,'Intertek ITS Testing Services Co','Laboratory Division, KFIP- AL Jubail Port,  Kingdom of Saudi Arabia','+966 533118129','muhammad.zeeshan@intertek.com','Mr. Muhammad Zeeshan Butt','muhammad.zeeshan@intertek.com','+966 533118129','2025-12-17','Pending','2025-12-18','24_hours','','QUO-PRM000004','2025-12-17 10:10:37.201438',2,5,2,NULL,1,0,NULL),(6,'AYTB','Jubail, Kingdom of Saudi Arabia','+966 013-3437700 Ext.7710','MunirAhmad@aytb.com','Mr. Munir Ahmad','MunirAhmad@aytb.com','+966 551271193','2025-12-17','Pending','2025-12-18','24_hours','','QUO-PRM000005','2025-12-17 10:14:27.858895',2,6,1,NULL,1,0,2),(7,'Aesen Middle East. (Formerly known as  Miclyn Express Offshore)',NULL,NULL,NULL,'Mr. Dennis Kunnel Sam','dennis.sam@aesengroup.com',NULL,'2025-12-17','Approved','2025-12-18','24_hours','','QUO-PRM000006','2025-12-17 14:39:34.266984',2,7,1,NULL,1,0,NULL),(8,'Aesen Middle East. (Formerly known as  Miclyn Express Offshore)',NULL,NULL,NULL,'Mr. Basharat Ali','basharat.ali@aesengroup.com',NULL,'2025-12-17','Approved','2025-12-18','24_hours','','QUO-PRM000007','2025-12-17 14:39:46.551349',2,8,1,NULL,1,0,NULL),(9,'ATTIQ UR REHMAN CONT. CO.','Al-Khobar 34427, Kingdom of Saudi Arabia',NULL,NULL,'Mr. Naresh','naresh@aurcontracting.com',NULL,'2025-12-18','Pending','2025-12-21','24_hours','','QUO-PRM000008','2025-12-20 09:50:13.366145',2,10,2,NULL,1,0,NULL),(10,'ATTIQ UR REHMAN CONT. CO.','Al-Khobar 34427, Kingdom of Saudi Arabia',NULL,NULL,'Mr. Naresh','naresh@aurcontracting.com',NULL,'2025-12-18','Pending','2025-12-21','24_hours',NULL,'QUO-PRM000009','2025-12-20 09:50:48.966368',2,11,2,NULL,1,0,NULL),(11,'Imam Mohammad Ibn Saud Islamic  University','Riyadh, Saudi Arabia',NULL,NULL,'Mr. Raouf Hassan','rahassan@imamu.edu.sa','+966 566593033','2025-12-18','Pending','2025-12-21','24_hours','','QUO-PRM000010','2025-12-20 09:51:29.167664',2,12,2,NULL,1,0,NULL),(12,'Tamimi Contracting',NULL,NULL,NULL,'Mr. John Thomas','john.thomas@tamimicontracting.com',NULL,'2025-12-18','Pending','2025-12-21','24_hours','','QUO-PRM000011','2025-12-20 09:52:05.042965',2,13,1,NULL,1,0,NULL),(13,'Tamimi Contracting',NULL,NULL,NULL,'Mr. John Thomas','john.thomas@tamimicontracting.com',NULL,'2025-12-18','Pending','2025-12-21','24_hours','','QUO-PRM000015','2025-12-20 10:00:00.132569',2,17,1,NULL,1,0,NULL),(14,'TestCosa','Dammam, Saudi Arabia',NULL,NULL,'Mr. Bayan AlAttas','bayan@testcosa.com','+966598683583','2025-12-18','Pending','2025-12-21','24_hours','','QUO-PRM000013','2025-12-20 10:00:43.261010',2,15,1,NULL,1,0,NULL),(15,'Energy Tech','Dammam   Kingdom of Saudi Arabia',NULL,NULL,'Mr. Rami Al-Omran','omranra@spsp.edu.sa','+966 0562340350','2025-12-23','Pending','2025-12-21','24_hours',NULL,'QUO-PRM000014','2025-12-20 10:01:24.600958',2,16,1,NULL,1,0,NULL),(16,'Saudi Wells Technology Co.',NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-21','Pending','2025-12-22','24_hours','','QUO-PRM000016','2025-12-21 07:22:33.255732',2,18,2,NULL,1,0,NULL),(24,'SAUDI READYMIX CONCRETE COMPANY','31839 Al Dammam 31952,   Kingdom Of Saudi Arabia','+966 13 816 4998 ext 2627',NULL,'Mr. Mudassir  H. Hagalwadi',NULL,'+966 53 451 8513','2025-12-21','Approved','2025-12-22','24_hours','','QUO-PRM000017','2025-12-21 12:38:38.152131',2,19,2,NULL,1,0,NULL),(25,'Majan Construction Co. LTD','P.O. Box 3500, Al Hindi Tower, 5th Floor,  KHADEM AL HARAMAIN AL SHAREFEEN  BRANCH RD. – AL Khobar - KSA.',NULL,NULL,'Mr. Chilambarasan Rajendiran','Chilambarasan.Rajendiran@douglasohi.com','+966 (0)53 413 1114','2025-12-21','Pending','2025-12-22','24_hours','','QUO-PRM000018','2025-12-21 12:38:48.862261',2,20,2,NULL,1,0,NULL),(26,'AMIT Marine Limited','P.O. Box: 34712, Showroom 37, Al- Khobar, Al Sedfah, Auto Moto Complex  King Faisal Bin Abdulaziz Road, Saudi Arabia','+966 13 502 8969',NULL,'Mr. Kevin John Ninan','kevin.ninan@amitmarine.com','+966 54 059 7971','2025-12-22','Approved','2025-12-23','24_hours','','QUO-PRM000019','2025-12-22 12:06:01.853621',2,21,2,NULL,1,0,NULL),(27,'ADCALES','Bldg no.7766, Additional no.4224, Aldanah  District, Al Sarqiyah, Al Jubail, Saudi Arabia','09947384437','akshaysambhu07@gmail.com','Mr. Farheen Banu','services@adcales.com','09947384437','2025-12-22','Pending','2025-12-23','24_hours',NULL,'QUO-PRM000020','2025-12-22 12:06:18.161540',2,22,1,NULL,1,0,NULL),(29,'test','Test','1234567890','marketbytesdevops@gmail.com','test','marketbytesdevops@gmail.com','1234567890','2025-12-24','Pending','2025-12-24','24_hours','','QUO-PRM000021','2025-12-23 10:14:10.736087',3,24,1,NULL,1,0,NULL),(30,'test','Test','1234567890','test@gmail.com','test@gmail.com','test@gmail.com','1234567890','2025-12-24','Pending','2025-12-24','24_hours','','QUO-PRM000022','2025-12-23 11:22:22.254688',4,25,2,NULL,1,0,NULL),(31,'RAPCO GROUPS','P.O.BOX 750, Ras Tanura 21041, Kingdom of  Saudi Arabia.',NULL,NULL,'Mr. Mohamed Safeer','mohamed.safeer@rapcogroups.com','+966-531214850','2025-12-22','Pending','2025-12-26','24_hours','','QUO-PRM000023','2025-12-25 07:17:06.459302',2,26,1,NULL,1,0,NULL),(32,'UNITED GROUP (UNITED WAREHOUSING  AND DISTRIBUTION SERVICES - JEDDAH)',NULL,NULL,NULL,'Mr. Mohammed Aslam','maslam@unitedgroup.com.sa',NULL,'2025-12-22','Pending','2025-12-26','24_hours','','QUO-PRM000024','2025-12-25 07:24:15.575978',2,27,1,NULL,1,0,NULL),(33,'UNITED GROUP (UNITED WAREHOUSING  AND DISTRIBUTION SERVICES - KHOBAR)',NULL,NULL,NULL,'Mr. Mohammed Aslam','maslam@unitedgroup.com.sa',NULL,'2025-12-22','Pending','2025-12-26','24_hours','','QUO-PRM000025','2025-12-25 07:24:27.475228',2,28,2,NULL,1,0,NULL),(34,'Binzagr For Industry and Maintenance Co.','P.O.Box:10669, Jubail 31961,  Kingdom Of Saudi Arabia',NULL,NULL,'Mr. Fahat Anis','fahat.anis@bfim.com.sa','+966 0581028191','2025-12-22','Pending','2025-12-26','24_hours','','QUO-PRM000026','2025-12-25 07:30:30.602244',2,29,1,NULL,1,0,NULL),(35,'AJWAD UTC COMPANY - KHOBAR',NULL,NULL,NULL,'Mr. Mohammed Aslam','maslam@unitedgroup.com.sa',NULL,'2025-12-23','Pending','2025-12-26','24_hours','','QUO-PRM000027','2025-12-25 07:30:40.896996',2,30,1,NULL,1,0,NULL),(36,'Binzagr For Industry and Maintenance Co.','P.O.Box:10669, Jubail 31961,  Kingdom Of Saudi Arabia',NULL,NULL,'Mr. Fahat Anis','fahat.anis@bfim.com.sa','+966 0581028191',NULL,'Pending','2025-12-26','24_hours','','QUO-PRM000028','2025-12-25 07:35:55.360415',2,31,2,NULL,1,0,NULL),(37,'Ansaldo Energia',NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-23','Pending','2025-12-26','24_hours','','QUO-PRM000029','2025-12-25 07:50:08.833636',2,32,2,NULL,1,0,NULL),(38,'Gulf Horizon Industry','Dhahran, Saudi Arabia',NULL,NULL,'Mr. Zeeshan Ahmad','purchase@gulf-horizon.sa','+966 58 128 1169','2025-12-24','Pending','2025-12-26','24_hours','','QUO-PRM000030','2025-12-25 08:07:44.131800',2,34,1,NULL,1,0,NULL),(39,'TestCosa','Dammam, Saudi Arabia',NULL,NULL,'Mr. Bayan AlAttas','bayan@testcosa.com','+966598683583','2025-12-24','Pending','2025-12-26','24_hours','','QUO-PRM000031','2025-12-25 08:27:39.779918',2,35,1,NULL,1,0,NULL),(40,'Zamil Offshore','Jeddah Pier., Kingdom of Saudi Arabia',NULL,NULL,'Mr. Vibin Raj','wp.procurement@zamiloffshore.com','+966530735016/+966573192549','2025-12-24','Pending','2025-12-26','24_hours','','QUO-PRM000032','2025-12-25 08:27:59.907004',2,36,1,NULL,1,0,NULL),(41,'RAPCO GROUPS','P.O.BOX 750, Ras Tanura 21041, Kingdom of  Saudi Arabia.',NULL,NULL,'Mr. Mohamed Safeer','mohamed.safeer@rapcogroups.com','+966-531214850','2025-12-24','Pending','2025-12-26','24_hours','','QUO-PRM000033','2025-12-25 08:32:54.629615',2,37,1,NULL,1,0,NULL),(42,'TestCosa','Dammam, Saudi Arabia',NULL,NULL,'Mr. Bayan AlAttas','bayan@testcosa.com','+966598683583','2025-12-25','Pending','2025-12-26','24_hours',NULL,'QUO-PRM000034','2025-12-25 08:36:32.201906',2,38,1,NULL,1,0,NULL),(43,'Al Jalhami Contracting and Trading Co','2057 Al Amir Nayif BIn Abdul Aziz Al Khafji 39253 Ash Sharqiyah Saudi Arabia',NULL,NULL,NULL,NULL,NULL,'2025-12-27','Pending','2025-12-28','24_hours',NULL,'QUO-PRM000036','2025-12-27 13:40:12.665591',2,40,2,NULL,1,0,NULL),(44,'Simple Solutions Trading, Industrial  Services and Maintenance Co.','20 Street, Cross Street 39, Dammam 2nd  Industrial City, Saudi Arabia',NULL,NULL,'Mr. Adnan Baig','baig@sst-sa.com','+966 (0) 55 400 8708','2025-12-27','Pending','2025-12-28','24_hours','','QUO-PRM000037','2025-12-27 13:40:27.596053',2,41,1,NULL,1,0,NULL),(47,'Future optima pvt ltd','KAUSTHUBHAM,CHERTHALA,VARANADU P O,CHENGANDA','09947384437','akshaysambhu07@gmail.com','AKASH K A','akshaysambhu07@gmail.com','09947384437','2025-12-29','Pending','2025-12-30','24_hours',NULL,'QUO-PRM000038','2025-12-29 09:13:39.207858',3,42,1,NULL,1,1,NULL),(49,'Saudi Wells Technology Co.',NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-25','Pending','2025-12-31','24_hours',NULL,'QUO-PRM000035','2025-12-30 10:25:39.016350',2,39,2,NULL,1,0,NULL),(51,'quest innovative','KAUSTHUBHAM,CHERTHALA,VARANADU P O,CHENGANDA','09947384437','akshaysambhu07@gmail.com','AKASH K A','akshaysambhu07@gmail.com','09947384437','2026-01-03','Pending','2025-12-31','24_hours',NULL,'QUO-PRM000039','2025-12-30 10:34:12.298852',3,43,1,NULL,1,1,NULL),(52,'TEST',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Pending','2025-12-31','24_hours',NULL,'QUO-PRM000040','2025-12-30 11:54:11.126262',2,45,NULL,NULL,1,0,NULL),(53,'zeroda','KAUSTHUBHAM,CHERTHALA,VARANADU P O,CHENGANDA','09947384437','akshaysambhu07@gmail.com','AKASH K A','akshaysambhu07@gmail.com','09947384437','2026-01-03','Pending','2025-12-31','24_hours',NULL,'QUO-PRM000041','2025-12-30 12:12:31.348155',3,46,2,NULL,1,0,NULL),(54,'TEST','KSA',NULL,NULL,'TEST',NULL,NULL,NULL,'Pending','2025-12-31','24_hours',NULL,'QUO-PRM000042','2025-12-30 13:18:04.537900',2,47,2,NULL,1,0,NULL),(55,'Simple Solutions Trading, Industrial  Services and Maintenance Co.','20 Street, Cross Street 39, Dammam 2nd  Industrial City, Saudi Arabia',NULL,NULL,'Mr. Adnan Baig','baig@sst-sa.com','+966 (0) 55 400 8708','2025-12-27','Pending','2026-01-05','24_hours','','QUO-PRM000043','2026-01-04 09:14:58.395743',2,48,1,NULL,1,0,NULL),(56,'Advanced Construction Technology  Services (ACTS)','Al Khobar, Saudi Arabia',NULL,NULL,'Mr. Mohamed Sharukkhan','MSharukkhan@acts-int.com','+966 55 939 4364','2025-12-28','Pending','2026-01-05','24_hours','','QUO-PRM000044','2026-01-04 09:18:28.459187',2,49,1,NULL,1,0,NULL),(57,'Zamil Industrial Coatings','116 2nd Industrial City, Dammam, Kingdom of  Saudi Arabia','+966 13-8337130 ext.2612',NULL,'Ms. Norah Alduhailan','norah.alduhailan@zamilcoating.com',NULL,'2025-12-28','Pending','2026-01-05','24_hours','','QUO-PRM000045','2026-01-04 09:19:21.678643',2,50,1,NULL,1,0,NULL),(58,'ATTIQ UR REHMAN CONT. CO.','Al-Khobar 34427, Kingdom of Saudi Arabia',NULL,NULL,'Mr. Naresh','naresh@aurcontracting.com',NULL,NULL,'Pending','2026-01-05','24_hours','','QUO-PRM000046','2026-01-04 09:19:44.512095',2,51,2,NULL,1,0,NULL),(59,'Abdullah Hadi Balharith & Partner Co',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Pending','2026-01-05','24_hours',NULL,'QUO-PRM000047','2026-01-04 09:20:12.676538',2,52,2,NULL,1,0,NULL),(60,'Binzagr For Industry and Maintenance Co.','P.O.Box:10669, Jubail 31961,  Kingdom Of Saudi Arabia',NULL,NULL,'Mr. Fahat Anis','fahat.anis@bfim.com.sa','+966 0581028191',NULL,'Pending','2026-01-05','24_hours','','QUO-PRM000048','2026-01-04 09:20:55.872299',2,53,1,NULL,1,0,NULL),(61,'Binzagr For Industry and Maintenance Co.','P.O.Box:10669, Jubail 31961,  Kingdom Of Saudi Arabia',NULL,NULL,'Mr. Fahat Anis','fahat.anis@bfim.com.sa','+966 0581028191',NULL,'Pending','2026-01-05','24_hours','','QUO-PRM000049','2026-01-04 09:29:56.126000',2,54,1,NULL,1,0,NULL),(62,'Aesen Middle East. (Formerly known as  Miclyn Express Offshore)',NULL,NULL,NULL,'Mr. Basharat Ali','basharat.ali@aesengroup.com',NULL,NULL,'Pending','2026-01-05','24_hours','','QUO-PRM000050','2026-01-04 09:30:18.973945',2,55,1,NULL,1,0,NULL),(63,'Al Jalhami Contracting and Trading Co','2057 Al Amir Nayif BIn Abdul Aziz Al Khafji 39253 Ash Sharqiyah Saudi Arabia',NULL,NULL,NULL,NULL,NULL,NULL,'Pending','2026-01-05','24_hours','','QUO-PRM000051','2026-01-04 09:30:39.300834',2,56,1,NULL,1,0,NULL),(64,'Phuel Oil Tools Saudi Arabia Company','Near 2nd Industrial Area, Dhahran- Abqaiq  Highway, Dammam 34341-6301, Kingdom of  Saudi Arabia',NULL,NULL,'Mr. Riyas Badarudeen','riyasb@phueloiltools.com.sa',NULL,NULL,'Pending','2026-01-05','24_hours','','QUO-PRM000052','2026-01-04 09:31:01.461247',2,57,2,NULL,1,0,NULL),(65,'CDI Products Arabia Industrial LLC',NULL,NULL,NULL,'Mr. Elayaraja Muthaiah','Elayaraja.muthaiah@cdiproducts.com',NULL,NULL,'Pending','2026-01-05','24_hours','','QUO-PRM000053','2026-01-04 09:31:24.041934',2,58,1,NULL,1,0,NULL),(66,'RAPCO GROUPS','P.O.BOX 750, Ras Tanura 21041, Kingdom of  Saudi Arabia.',NULL,NULL,'Mr. Mohamed Safeer','mohamed.safeer@rapcogroups.com','+966-531214850',NULL,'Pending','2026-01-05','24_hours','','QUO-PRM000054','2026-01-04 09:31:47.247653',2,59,1,NULL,1,0,NULL),(67,'Nesma Industrial Services Co. Ltd.','P.O. BOX: 3402, Al-Khobar 31952, K.S.A.',NULL,NULL,'Mr. Shaik Saleem','ssaleem@nesma.com','+966 538889732',NULL,'Pending','2026-01-05','24_hours','','QUO-PRM000055','2026-01-04 09:32:12.997506',2,60,1,NULL,1,0,NULL),(68,'Aesen Middle East. (Formerly known as  Miclyn Express Offshore)',NULL,NULL,NULL,'Mr. Lenin Lama','lenin.lama@aesengroup.com',NULL,NULL,'Pending','2026-01-05','24_hours','','QUO-PRM000056','2026-01-04 09:32:31.636642',2,61,1,NULL,1,0,NULL),(69,'RAPCO GROUPS','P.O.BOX 750, Ras Tanura 21041, Kingdom of  Saudi Arabia.',NULL,NULL,'Mr. Mohamed Safeer','mohamed.safeer@rapcogroups.com','+966-531214850',NULL,'Pending','2026-01-05','24_hours','','QUO-PRM000057','2026-01-04 09:32:53.183456',2,62,1,NULL,1,0,NULL),(70,'ATTIQ UR REHMAN CONT. CO.','Al-Khobar 34427, Kingdom of Saudi Arabia',NULL,NULL,'Mr. Naresh','naresh@aurcontracting.com',NULL,NULL,'Pending','2026-01-05','24_hours','','QUO-PRM000058','2026-01-04 09:33:09.260328',2,63,2,NULL,1,0,NULL),(71,'ATTIQ UR REHMAN CONT. CO.','Al-Khobar 34427, Kingdom of Saudi Arabia',NULL,NULL,'Mr. Naresh','naresh@aurcontracting.com',NULL,NULL,'Pending','2026-01-05','24_hours','','QUO-PRM000059','2026-01-04 09:34:28.593942',2,64,2,NULL,1,0,NULL),(72,'ATTIQ UR REHMAN CONT. CO.','Al-Khobar 34427, Kingdom of Saudi Arabia',NULL,NULL,'Mr. Naresh','naresh@aurcontracting.com',NULL,NULL,'Pending','2026-01-05','24_hours','','QUO-PRM000060','2026-01-04 09:34:47.556583',2,65,2,NULL,1,0,NULL),(73,'Binzagr For Industry and Maintenance Co.','P.O.Box:10669, Jubail 31961,  Kingdom Of Saudi Arabia',NULL,NULL,'Mr. Fahat Anis','fahat.anis@bfim.com.sa','+966 0581028191',NULL,'Pending','2026-01-05','24_hours','','QUO-PRM000061','2026-01-04 09:35:10.784015',2,66,1,NULL,1,0,NULL),(74,'Majan Construction Co. LTD','P.O. Box 3500, Al Hindi Tower, 5th Floor,  KHADEM AL HARAMAIN AL SHAREFEEN  BRANCH RD. – AL Khobar - KSA.',NULL,NULL,'Mr. Chilambarasan Rajendiran','Chilambarasan.Rajendiran@douglasohi.com','+966 (0)53 413 1114',NULL,'Pending','2026-01-05','24_hours','','QUO-PRM000062','2026-01-04 09:35:32.621473',2,67,2,NULL,1,0,NULL),(75,'Safety House Trading Est',NULL,NULL,NULL,'Mr. Jose Jhon',NULL,'+966 56 670 0412',NULL,'Pending','2026-01-05','24_hours','','QUO-PRM000063','2026-01-04 09:35:48.359560',2,68,2,NULL,1,0,NULL),(76,'Aesen Middle East. (Formerly known as  Miclyn Express Offshore)',NULL,NULL,NULL,'Mr. Tanwir Muhammad','tanwir.muhammad@aesengroup.com',NULL,NULL,'Pending','2026-01-06','24_hours','','QUO-PRM000064','2026-01-05 12:26:18.699181',2,69,1,NULL,1,0,NULL),(77,'Aesen Middle East. (Formerly known as  Miclyn Express Offshore)',NULL,NULL,NULL,'Mr. Basharat Ali','basharat.ali@aesengroup.com',NULL,NULL,'Pending','2026-01-06','24_hours','','QUO-PRM000065','2026-01-05 12:26:37.492112',2,70,1,NULL,1,0,NULL),(78,'Aesen Middle East. (Formerly known as  Miclyn Express Offshore)',NULL,NULL,NULL,'Mr. Basharat Ali','basharat.ali@aesengroup.com',NULL,NULL,'Pending','2026-01-06','24_hours','','QUO-PRM000066','2026-01-05 12:26:55.868900',2,71,1,NULL,1,0,NULL),(79,'Aesen Middle East. (Formerly known as  Miclyn Express Offshore)',NULL,NULL,NULL,'Mr. Basharat Ali','basharat.ali@aesengroup.com',NULL,NULL,'Pending','2026-01-06','24_hours','','QUO-PRM000067','2026-01-05 12:27:16.622480',2,72,1,NULL,1,0,NULL),(80,'Zamil Industrial Coatings','116 2nd Industrial City, Dammam, Kingdom of  Saudi Arabia','+966 13-8337130 ext.2612',NULL,'Ms. Norah Alduhailan','norah.alduhailan@zamilcoating.com',NULL,NULL,'Approved','2026-01-06','24_hours','','QUO-PRM000068','2026-01-05 12:33:42.300234',2,73,1,NULL,1,0,NULL),(81,'Advanced Precision for Industrial Services  LTD Co (APS)','Khalidiya | Dammam, Kingdom of Saudi Arabia  PO Box: 1769 | Zip Code: 32225',NULL,NULL,'Mr. Abdul Mannan','mannan@aps-sa.com',NULL,NULL,'Pending','2026-01-06','24_hours',NULL,'QUO-PRM000069','2026-01-05 12:34:08.737437',2,74,2,NULL,1,0,NULL),(82,'zeroda','KAUSTHUBHAM,CHERTHALA,VARANADU P O,CHENGANDA','09947384437','akshaysambhu07@gmail.com','AKASH K A','akshaysambhu07@gmail.com','09947384437','2026-01-08','Pending','2026-01-07','24_hours',NULL,'QUO-PRM000070','2026-01-06 09:40:10.512547',3,75,1,NULL,1,0,NULL),(83,'Binzagr For Industry and Maintenance Co.','P.O.Box:10669, Jubail 31961,  Kingdom Of Saudi Arabia',NULL,NULL,'Mr. Fahat Anis','fahat.anis@bfim.com.sa','+966 0581028191',NULL,'Approved','2026-01-07','24_hours',NULL,'QUO-PRM000071','2026-01-06 12:55:01.838568',2,76,2,NULL,1,0,NULL),(84,'Expertise','P.O. Box 10353, Al Jubail 31961, Saudi Arabia',NULL,NULL,NULL,'m.kashif@expertindus.com',NULL,NULL,'Pending','2026-01-13','24_hours','','QUO-PRM000072','2026-01-12 07:33:20.166339',2,77,NULL,NULL,1,0,NULL),(85,'Zamil Industrial Coatings','116 2nd Industrial City, Dammam, Kingdom of  Saudi Arabia','+966 13-8337130 ext.2612',NULL,'Ms. Norah Alduhailan','norah.alduhailan@zamilcoating.com',NULL,NULL,'Pending','2026-01-13','24_hours','','QUO-PRM000073','2026-01-12 07:33:41.187686',2,78,1,NULL,1,0,NULL),(86,'Binzagr For Industry and Maintenance Co.','P.O.Box:10669, Jubail 31961,  Kingdom Of Saudi Arabia',NULL,NULL,'Mr. Fahat Anis','fahat.anis@bfim.com.sa','+966 0581028191',NULL,'Approved','2026-01-13','24_hours','','QUO-PRM000074','2026-01-12 07:34:00.605492',2,79,1,NULL,1,0,NULL),(87,'Advanced Construction Technology  Services (ACTS)','Al Khobar, Saudi Arabia',NULL,NULL,'Mr. Mohamed Sharukkhan','MSharukkhan@acts-int.com','+966 55 939 4364',NULL,'Pending','2026-01-13','24_hours','','QUO-PRM000075','2026-01-12 07:34:22.539321',2,80,1,NULL,1,0,NULL),(88,'ERAM HYDRAULICS','148 Cross , 67th Cross Road | 2nd Industrial City  |PO Box: 95589 | Dammam 3195 | Saudi Arabia',NULL,NULL,'Mr. Mohammed Mujahid','proc1@eramhydraulics.com','+966 54 240 1731',NULL,'Pending','2026-01-13','24_hours','','QUO-PRM000076','2026-01-12 07:34:39.745569',2,81,2,NULL,1,0,NULL),(89,'CDI Products Arabia Industrial LLC',NULL,NULL,NULL,'Mr. Elayaraja Muthaiah','Elayaraja.muthaiah@cdiproducts.com',NULL,NULL,'Approved','2026-01-13','24_hours','','QUO-PRM000077','2026-01-12 07:35:16.017650',2,82,1,NULL,1,0,NULL),(90,'Al Jalhami Contracting and Trading Co','2057 Al Amir Nayif BIn Abdul Aziz Al Khafji 39253 Ash Sharqiyah Saudi Arabia',NULL,NULL,NULL,NULL,NULL,NULL,'Pending','2026-01-13','24_hours','','QUO-PRM000078','2026-01-12 07:35:47.101571',2,83,2,NULL,1,0,NULL),(91,'Arabian Machinery & Heavy Equipment  Co.','P.O.Box-2884, Al Khobar 31952, Kingdom of  Saudi Arabia','+966 (0) 13 8970444 Ext. 506',NULL,'Mr. Chandrakanth Ramayya','chandrakanth.ramayya@amhec.com','+966 (0) 550170364',NULL,'Pending','2026-01-13','24_hours','','QUO-PRM000079','2026-01-12 07:36:10.497679',2,84,1,NULL,1,0,NULL),(92,'Zamil Industrial Coatings','116 2nd Industrial City, Dammam, Kingdom of  Saudi Arabia','+966 13-8337130 ext.2612',NULL,'Ms. Norah Alduhailan','norah.alduhailan@zamilcoating.com',NULL,NULL,'Pending','2026-01-28','24_hours','','QUO-PRM000080','2026-01-27 10:38:20.049227',2,85,1,NULL,1,0,NULL),(93,'Frontier Group International W.L.L.','Building No. 3964, Prince Saud Ibn Muhammad  Ibn Muqrin, Tuwaiq Dist, Zip Code 14931.  Riyadh, Kingdom of Saudi Arabia','+974 4450-4339',NULL,'Mr. Mohammed Sohail','liftingcoordinator@fgi-me.com','+966 500639563',NULL,'Pending','2026-01-28','24_hours','','QUO-PRM000081','2026-01-27 10:38:45.543115',2,86,1,NULL,1,0,NULL),(94,'Hadi Hammad Al Hammam Holding Co','117 Prince Naif Street,  P.O. Box 3,   Rahima 319413,  Eastern Province,  Kingdom of Saudi Arabia',NULL,NULL,NULL,NULL,NULL,NULL,'Pending','2026-01-28','24_hours','','QUO-PRM000082','2026-01-27 10:39:05.568483',2,87,2,NULL,1,0,NULL),(95,'Intertek ITS Testing Services Co','Laboratory Division, KFIP- AL Jubail Port,  Kingdom of Saudi Arabia','+966 533118129','muhammad.zeeshan@intertek.com','Mr. Muhammad Zeeshan Butt','muhammad.zeeshan@intertek.com','+966 533118129',NULL,'Pending','2026-01-28','24_hours','','QUO-PRM000083','2026-01-27 10:39:35.164039',2,88,2,NULL,1,0,NULL),(96,'NAMARIQ','Jeddah, Saudi Arabia',NULL,NULL,NULL,NULL,NULL,NULL,'Pending','2026-01-28','24_hours',NULL,'QUO-PRM000084','2026-01-27 10:39:50.380639',2,89,NULL,NULL,1,0,NULL),(97,'Trial','NA','1234','danny@primearabiagroup.com','Trial','danny@primearabiagroup.com','1234','2026-02-11','Approved','2026-02-11','24_hours','','QUO-PRM000085','2026-02-10 12:45:20.612350',5,90,1,'price wrong',1,1,NULL);
/*!40000 ALTER TABLE `pre_job_quotation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pre_job_quotationitem`
--

DROP TABLE IF EXISTS `pre_job_quotationitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pre_job_quotationitem` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `quantity` int unsigned DEFAULT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `item_id` bigint DEFAULT NULL,
  `quotation_id` bigint NOT NULL,
  `unit_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pre_job_quotationitem_item_id_669cccca_fk_item_item_id` (`item_id`),
  KEY `pre_job_quotationite_quotation_id_95fda87d_fk_pre_job_q` (`quotation_id`),
  KEY `pre_job_quotationitem_unit_id_6a453597_fk_unit_unit_id` (`unit_id`),
  CONSTRAINT `pre_job_quotationite_quotation_id_95fda87d_fk_pre_job_q` FOREIGN KEY (`quotation_id`) REFERENCES `pre_job_quotation` (`id`),
  CONSTRAINT `pre_job_quotationitem_item_id_669cccca_fk_item_item_id` FOREIGN KEY (`item_id`) REFERENCES `item_item` (`id`),
  CONSTRAINT `pre_job_quotationitem_unit_id_6a453597_fk_unit_unit_id` FOREIGN KEY (`unit_id`) REFERENCES `unit_unit` (`id`),
  CONSTRAINT `pre_job_quotationitem_chk_1` CHECK ((`quantity` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=6241 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pre_job_quotationitem`
--

LOCK TABLES `pre_job_quotationitem` WRITE;
/*!40000 ALTER TABLE `pre_job_quotationitem` DISABLE KEYS */;
INSERT INTO `pre_job_quotationitem` VALUES (29,5,100.00,27,5,2),(30,1,150.00,28,5,2),(31,1,135.00,29,5,2),(32,20,75.00,30,6,2),(33,5,25.00,31,6,2),(34,5,150.00,32,6,2),(35,20,100.00,33,6,2),(36,5,300.00,34,6,2),(37,2,100.00,35,6,2),(38,1,150.00,36,6,2),(39,1,90.00,37,6,2),(40,4,100.00,38,6,2),(41,3,150.00,39,6,2),(42,1,100.00,40,6,2),(43,10,65.00,41,6,2),(44,2,50.00,42,6,2),(45,5,50.00,43,6,2),(46,1,100.00,44,6,2),(47,40,50.00,45,6,2),(48,20,75.00,46,6,2),(49,12,100.00,47,6,2),(50,15,90.00,48,6,2),(51,1,90.00,49,6,2),(52,20,65.00,50,6,2),(53,5,150.00,51,6,2),(54,2,150.00,52,6,2),(55,4,150.00,53,6,2),(56,2,150.00,54,6,2),(57,3,150.00,55,6,2),(58,20,75.00,56,6,2),(59,10,150.00,57,6,2),(60,3,400.00,58,6,2),(61,40,100.00,59,6,2),(62,10,100.00,60,6,2),(63,1,850.00,61,7,2),(64,1,850.00,62,8,2),(65,1,100.00,63,9,2),(67,1,900.00,65,11,2),(68,1,250.00,66,11,2),(69,1,400.00,67,11,2),(70,1,400.00,68,11,2),(71,1,500.00,69,11,2),(72,2,400.00,70,11,2),(73,1,500.00,71,11,2),(74,3,200.00,72,11,2),(75,1,500.00,73,11,2),(76,1,400.00,74,11,2),(77,100,35.00,75,12,2),(78,50,35.00,76,12,2),(79,400,35.00,77,12,2),(80,1,125.00,78,13,2),(81,1,225.00,79,13,2),(82,1,90.00,80,13,2),(83,1,90.00,81,13,2),(84,1,90.00,82,13,2),(85,2,100.00,83,13,2),(86,1,15.00,84,13,2),(87,1,150.00,85,13,2),(88,1,100.00,86,13,2),(89,1,25.00,87,13,2),(90,2,135.00,88,13,2),(91,2,90.00,89,13,2),(92,1,135.00,88,13,2),(93,1,100.00,90,13,2),(94,1,125.00,91,13,2),(95,9,90.00,92,13,2),(96,46,35.00,75,13,2),(97,6,150.00,93,13,2),(98,1,150.00,94,13,2),(99,1,50.00,95,13,2),(100,4,180.00,96,13,2),(101,6,35.00,76,13,2),(102,2,90.00,97,13,2),(103,1,90.00,98,13,2),(104,2,90.00,99,13,2),(105,7,50.00,1,13,2),(106,1,65.00,100,13,2),(107,1,65.00,101,13,2),(108,1,65.00,102,13,2),(109,1,65.00,103,13,2),(110,1,65.00,104,13,2),(111,1,65.00,105,13,2),(112,1,65.00,106,13,2),(113,1,65.00,107,13,2),(114,5,75.00,108,13,2),(115,225,35.00,77,13,2),(116,4,50.00,109,13,2),(117,1,50.00,110,13,2),(118,1,25.00,111,13,2),(119,3,135.00,112,13,2),(120,1,20.00,113,13,2),(121,1,200.00,114,13,2),(122,1,180.00,115,13,2),(123,1,135.00,116,13,2),(124,1,75.00,117,14,2),(125,1,75.00,118,14,2),(126,1,150.00,119,14,2),(127,1,150.00,120,14,2),(128,1,150.00,121,14,2),(129,4,75.00,122,14,2),(130,3,75.00,123,14,2),(131,1,150.00,124,14,2),(132,1,75.00,125,14,2),(133,1,90.00,126,14,2),(134,1,75.00,127,14,2),(167,2,200.00,10,16,2),(168,2,200.00,94,16,2),(169,7,100.00,1,16,2),(170,1,100.00,160,16,2),(171,2,150.00,161,16,2),(172,5,200.00,162,16,2),(173,1,350.00,163,16,2),(174,1,200.00,164,16,2),(175,1,200.00,165,16,2),(176,2,NULL,166,16,2),(177,1,NULL,167,16,2),(178,1,90.00,168,24,2),(179,1,90.00,169,24,2),(180,1,90.00,170,24,2),(181,1,90.00,171,24,2),(182,1,90.00,172,24,2),(183,1,90.00,173,24,2),(184,1,90.00,174,24,2),(185,2,85.00,76,25,2),(186,1,140.00,175,25,2),(187,2,50.00,176,25,2),(188,4,160.00,177,25,2),(189,1,150.00,178,25,2),(190,1,50.00,1,25,2),(191,1,90.00,179,25,2),(192,1,90.00,180,25,2),(193,3,75.00,1,26,2),(194,1,100.00,181,26,2),(195,1,150.00,182,26,2),(196,2,150.00,183,26,2),(197,2,100.00,184,26,2),(200,4,150.00,1,29,1),(201,4,150.00,1,30,1),(202,20,40.00,185,31,2),(203,25,200.00,186,32,2),(204,2,200.00,187,32,2),(205,7,200.00,188,32,2),(206,8,200.00,189,32,2),(207,3,200.00,190,32,2),(208,2,200.00,182,32,2),(209,2,200.00,191,33,2),(210,5,200.00,187,33,2),(211,9,200.00,188,33,2),(212,3,200.00,189,33,2),(213,5,200.00,190,33,2),(214,2,200.00,182,33,2),(215,1,100.00,192,34,2),(216,1,100.00,78,34,2),(217,2,100.00,193,34,2),(218,1,100.00,194,34,2),(219,1,125.00,195,34,2),(220,2,200.00,189,35,2),(221,2,100.00,196,36,2),(222,2,100.00,80,36,2),(223,2,100.00,193,36,2),(224,2,100.00,197,36,2),(225,1,100.00,198,36,2),(226,2,150.00,85,36,2),(227,9,65.00,1,36,2),(228,6,75.00,199,36,2),(229,13,75.00,200,36,2),(230,2,200.00,201,36,2),(231,81,50.00,202,37,2),(232,2,50.00,203,37,2),(233,3,50.00,204,37,2),(234,1,100.00,205,37,2),(235,1,75.00,206,38,2),(236,1,75.00,207,38,2),(237,1,75.00,208,38,2),(238,1,75.00,209,38,2),(239,1,75.00,210,38,2),(240,1,150.00,211,38,2),(241,1,150.00,211,38,2),(242,1,75.00,212,38,2),(243,1,75.00,213,38,2),(244,1,75.00,214,38,2),(245,1,75.00,215,38,2),(246,1,75.00,216,38,2),(247,1,75.00,217,38,2),(248,1,75.00,212,38,2),(249,1,75.00,218,38,2),(250,1,75.00,219,38,2),(251,1,75.00,220,38,2),(252,1,75.00,221,38,2),(253,1,75.00,222,38,2),(254,4,100.00,223,39,2),(255,8,1000.00,224,40,2),(256,1,85.00,225,41,2),(257,1,85.00,226,41,2),(258,1,85.00,227,41,2),(259,1,85.00,228,41,2),(300,4,50.00,266,44,2),(301,1,50.00,267,44,2),(302,2,50.00,268,44,2),(303,1,50.00,269,44,2),(304,3,50.00,270,44,2),(664,4,200.00,259,43,2),(665,2,200.00,78,43,2),(666,2,75.00,199,43,2),(667,8,50.00,1,43,2),(668,1,155.00,260,43,2),(669,1,180.00,85,43,2),(670,1,200.00,261,43,2),(671,7,200.00,262,43,2),(672,1,200.00,263,43,2),(673,1,750.00,264,43,2),(674,1,750.00,265,43,2),(675,40,150.00,271,43,2),(676,12,150.00,272,43,2),(677,2,550.00,273,43,2),(1320,4,150.00,1,47,1),(1321,2,120.00,2,47,1),(1322,5,150.00,10,47,1),(1323,2,1200.00,16,47,1),(1324,2,120.00,1,47,1),(1325,34,120.00,2,47,2),(1352,1,305.00,175,27,2),(1353,5,89.00,19,27,2),(1925,4,150.00,1,51,1),(1926,3,1200.00,7,51,1),(1927,3,120.00,23,51,3),(1928,5,120.00,278,51,4),(1929,4,120.00,1,51,1),(1930,4,232.00,5,51,3),(2002,1,75.00,271,52,2),(2011,4,150.00,1,53,1),(2012,4,230.00,1,53,1),(2237,6,300.00,128,15,2),(2238,2,650.00,129,15,2),(2239,11,35.00,130,15,2),(2240,10,100.00,131,15,2),(2241,2,100.00,132,15,2),(2242,4,150.00,133,15,2),(2243,3,650.00,134,15,2),(2244,2,150.00,135,15,2),(2245,1,150.00,136,15,2),(2246,9,150.00,137,15,2),(2247,4,100.00,138,15,2),(2248,4,100.00,139,15,2),(2249,4,100.00,140,15,2),(2250,3,100.00,141,15,2),(2251,4,100.00,142,15,2),(2252,5,150.00,143,15,2),(2253,3,150.00,144,15,2),(2254,10,150.00,145,15,2),(2255,11,150.00,146,15,2),(2256,10,150.00,147,15,2),(2257,9,150.00,148,15,2),(2258,8,150.00,149,15,2),(2259,9,150.00,150,15,2),(2260,8,150.00,151,15,2),(2261,13,100.00,152,15,2),(2262,2,20.00,153,15,2),(2263,4,20.00,154,15,2),(2264,5,20.00,155,15,2),(2265,6,20.00,156,15,2),(2266,13,20.00,157,15,2),(2267,3,20.00,158,15,2),(2268,1,200.00,159,15,2),(2283,1,75.00,1,54,2),(2304,2,150.00,161,49,2),(2305,6,225.00,256,49,2),(2306,19,100.00,1,49,2),(2307,2,500.00,257,49,2),(2308,1,350.00,258,49,2),(2309,4,50.00,283,55,2),(2310,1,50.00,284,55,2),(2311,2,50.00,285,55,2),(2312,1,50.00,286,55,2),(2313,3,50.00,287,55,2),(2314,1,100.00,288,56,2),(2315,1,100.00,289,56,2),(2316,1,100.00,290,56,2),(2317,1,100.00,291,56,2),(2318,1,100.00,292,56,2),(2319,1,100.00,293,56,2),(2320,1,100.00,294,56,2),(2321,1,100.00,295,56,2),(2322,1,100.00,296,56,2),(2323,1,100.00,297,56,2),(2324,1,100.00,298,56,2),(2325,1,100.00,299,56,2),(2326,1,100.00,300,56,2),(2327,1,100.00,301,56,2),(2328,1,100.00,302,56,2),(2329,1,100.00,303,56,2),(2330,1,100.00,304,56,2),(2331,1,100.00,305,56,2),(2332,1,200.00,306,56,2),(2333,1,200.00,307,56,2),(2334,1,200.00,308,56,2),(2335,1,75.00,309,56,2),(2336,1,100.00,182,56,2),(2337,1,75.00,310,56,2),(2338,2,75.00,311,57,2),(2339,1,75.00,312,57,2),(2340,1,90.00,313,57,2),(2341,6,90.00,314,57,2),(2342,1,90.00,315,57,2),(2343,1,90.00,316,57,2),(2344,2,75.00,317,57,2),(2345,1,75.00,318,57,2),(2346,1,75.00,319,57,2),(2347,1,75.00,320,57,2),(2348,1,75.00,321,57,2),(2349,1,350.00,322,57,2),(2350,1,75.00,323,57,2),(2351,1,75.00,324,57,2),(2352,1,75.00,325,57,2),(2353,1,75.00,326,57,2),(2354,1,135.00,327,58,2),(2357,1,100.00,78,60,2),(2358,2,100.00,193,60,2),(2359,1,100.00,330,60,2),(2360,1,100.00,196,60,2),(2361,3,65.00,1,60,2),(2362,2,75.00,199,60,2),(2363,1,200.00,201,60,2),(2364,1,100.00,193,61,2),(2365,1,100.00,330,61,2),(2366,1,100.00,80,61,2),(2367,2,100.00,196,61,2),(2368,1,150.00,85,61,2),(2369,5,65.00,1,61,2),(2370,3,75.00,199,61,2),(2371,7,75.00,262,61,2),(2372,1,200.00,201,61,2),(2373,1,100.00,197,61,2),(2374,1,850.00,61,62,2),(2375,28,50.00,1,63,2),(2376,13,100.00,1,64,2),(2377,5,150.00,161,64,2),(2378,1,400.00,331,65,2),(2379,1,125.00,332,65,2),(2380,1,125.00,326,65,2),(2381,1,40.00,333,66,2),(2382,1,90.00,334,67,2),(2383,1,90.00,10,67,2),(2384,1,100.00,335,67,2),(2385,1,50.00,336,67,2),(2386,1,50.00,337,67,2),(2387,1,50.00,338,67,2),(2388,1,50.00,339,67,2),(2389,1,75.00,340,67,2),(2390,1,75.00,341,67,2),(2391,1,75.00,342,67,2),(2392,1,75.00,343,67,2),(2393,1,75.00,344,67,2),(2394,1,75.00,345,67,2),(2395,1,50.00,346,67,2),(2396,1,50.00,347,67,2),(2397,1,50.00,348,67,2),(2398,1,70.00,349,67,2),(2399,1,50.00,350,67,2),(2400,1,50.00,351,67,2),(2401,1,70.00,352,67,2),(2402,1,75.00,353,67,2),(2403,1,90.00,354,67,2),(2404,1,70.00,355,67,2),(2405,1,70.00,356,67,2),(2406,1,40.00,357,67,2),(2407,1,85.00,358,67,2),(2408,1,50.00,359,67,2),(2409,1,50.00,360,67,2),(2410,1,50.00,361,67,2),(2411,1,75.00,362,67,2),(2412,1,50.00,363,67,2),(2413,1,70.00,364,67,2),(2414,1,50.00,365,67,2),(2415,1,40.00,366,67,2),(2416,1,40.00,367,67,2),(2417,1,40.00,368,67,2),(2418,1,40.00,369,67,2),(2419,1,50.00,370,67,2),(2420,1,90.00,10,67,2),(2421,1,40.00,371,67,2),(2422,1,50.00,372,67,2),(2423,1,50.00,373,67,2),(2424,1,250.00,374,68,2),(2425,1,125.00,375,69,2),(2426,1,125.00,376,69,2),(2427,1,125.00,377,69,2),(2428,1,200.00,378,70,2),(2429,1,120.00,383,71,2),(2430,3,200.00,259,72,2),(2431,8,100.00,196,73,2),(2432,5,100.00,80,73,2),(2433,5,100.00,193,73,2),(2434,3,100.00,197,73,2),(2435,1,100.00,198,73,2),(2436,4,150.00,85,73,2),(2437,21,65.00,1,73,2),(2438,16,75.00,199,73,2),(2439,22,75.00,200,73,2),(2440,5,200.00,201,73,2),(2441,1,100.00,330,73,2),(2442,1,650.00,379,73,2),(2443,1,100.00,78,73,2),(2444,1,125.00,380,73,2),(2445,1,160.00,177,74,2),(2446,2,50.00,176,74,2),(2447,1,85.00,76,74,2),(2448,1,140.00,175,74,2),(2449,1,850.00,381,75,2),(2450,1,80.00,382,75,2),(2451,1,850.00,384,76,2),(2452,1,850.00,385,77,2),(2453,1,850.00,385,78,2),(2454,1,850.00,385,79,2),(2455,1,65.00,386,80,2),(2515,2,100.00,82,83,2),(2516,2,100.00,197,83,2),(2517,1,200.00,201,83,2),(2518,1,100.00,193,83,2),(2519,5,65.00,1,83,2),(2520,4,75.00,199,83,2),(2521,8,75.00,200,83,2),(2522,1,100.00,388,83,2),(2523,2,100.00,330,83,2),(2577,1,100.00,64,10,2),(4152,6,35.00,328,59,2),(4153,7,75.00,329,59,2),(4172,4,200.00,387,81,2),(4173,11,150.00,112,81,2),(4181,4,150.00,1,82,1),(4182,4,160.00,2,82,1),(4183,4,140.00,2,82,2),(4184,12,150.00,1,82,1),(4214,1,50.00,229,42,2),(4215,1,50.00,160,42,2),(4216,1,75.00,199,42,2),(4217,1,100.00,230,42,2),(4218,1,200.00,231,42,2),(4219,1,200.00,232,42,2),(4220,1,200.00,233,42,2),(4221,1,150.00,234,42,2),(4222,1,150.00,235,42,2),(4223,1,150.00,236,42,2),(4224,1,150.00,237,42,2),(4225,1,350.00,238,42,2),(4226,1,350.00,239,42,2),(4227,1,350.00,240,42,2),(4228,1,350.00,241,42,2),(4229,1,350.00,242,42,2),(4230,1,350.00,243,42,2),(4231,1,350.00,244,42,2),(4232,1,500.00,245,42,2),(4233,1,500.00,246,42,2),(4234,1,500.00,247,42,2),(4235,1,1000.00,248,42,2),(4236,1,1000.00,249,42,2),(4237,1,90.00,250,42,2),(4238,1,50.00,251,42,2),(4239,1,90.00,252,42,2),(4240,1,150.00,253,42,2),(4241,1,150.00,254,42,2),(4242,1,125.00,255,42,2),(4243,1,250.00,389,84,2),(4244,1,250.00,390,84,2),(4245,1,250.00,391,84,2),(4246,1,250.00,392,84,2),(4247,1,250.00,393,84,2),(4248,1,250.00,394,84,2),(4249,1,250.00,395,84,2),(4250,1,250.00,396,84,2),(4251,1,250.00,397,84,2),(4252,1,250.00,398,84,2),(4253,1,250.00,399,84,2),(4254,1,250.00,400,84,2),(4255,1,250.00,401,84,2),(4256,1,250.00,402,84,2),(4257,1,250.00,403,84,2),(4258,1,250.00,404,84,2),(4259,1,90.00,313,85,2),(4260,6,75.00,405,86,2),(4261,5,75.00,406,86,2),(4262,5,75.00,407,86,2),(4263,1,75.00,179,86,2),(4264,1,75.00,408,86,2),(4265,1,150.00,409,86,2),(4266,1,125.00,410,86,2),(4267,1,150.00,411,86,2),(4268,1,180.00,412,87,2),(4269,1,180.00,413,87,2),(4270,1,200.00,414,87,2),(4271,1,300.00,415,87,2),(4272,10,50.00,1,88,2),(4273,1,100.00,416,89,2),(4274,1,100.00,417,89,2),(4275,1,100.00,417,89,2),(4276,1,100.00,417,89,2),(4277,1,250.00,418,89,2),(4278,1,400.00,419,89,2),(4279,1,100.00,420,89,2),(4280,1,100.00,421,89,2),(4281,1,100.00,417,89,2),(4282,1,100.00,422,89,2),(4283,1,100.00,422,89,2),(4284,1,100.00,423,89,2),(4285,1,100.00,424,89,2),(4286,1,90.00,425,89,2),(4287,1,100.00,420,89,2),(4288,1,100.00,426,89,2),(4289,1,100.00,426,89,2),(4290,1,100.00,426,89,2),(4291,1,100.00,426,89,2),(4292,1,100.00,426,89,2),(4293,1,100.00,426,89,2),(4294,1,100.00,426,89,2),(4295,1,250.00,427,89,2),(4296,1,250.00,428,89,2),(4297,1,400.00,429,89,2),(4298,1,100.00,430,89,2),(4299,1,100.00,417,89,2),(4300,38,150.00,431,90,2),(4301,1,75.00,432,90,2),(4302,1,90.00,433,90,2),(4303,1,200.00,434,90,2),(4304,2,150.00,435,90,2),(4305,34,50.00,1,90,2),(4306,6,200.00,259,90,2),(4307,2,400.00,379,90,2),(4308,2,200.00,78,90,2),(4309,1,200.00,436,90,2),(4310,4,65.00,437,91,2),(4311,1,65.00,438,91,2),(4312,1,65.00,439,91,2),(4313,1,75.00,440,92,2),(4314,1,90.00,441,92,2),(4315,1,90.00,441,92,2),(4316,1,100.00,442,93,2),(4317,1,100.00,443,93,2),(4318,1,125.00,444,93,2),(4319,1,100.00,445,93,2),(4320,1,100.00,446,93,2),(4321,1,100.00,447,93,2),(4322,1,350.00,448,93,2),(4323,1,150.00,449,94,2),(4324,1,80.00,432,94,2),(4325,1,75.00,199,94,2),(4326,2,135.00,450,95,2),(4327,1,150.00,28,95,2),(4328,1,135.00,29,95,2),(4509,4,150.00,1,97,1),(4510,1,50.00,457,97,1),(4511,2,50.00,458,97,1),(4512,3,100.00,459,97,1),(6235,1,100.00,451,96,2),(6236,1,100.00,452,96,2),(6237,1,200.00,453,96,2),(6238,1,200.00,454,96,2),(6239,1,300.00,455,96,2),(6240,1,150.00,456,96,2);
/*!40000 ALTER TABLE `pre_job_quotationitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pre_job_quotationterms`
--

DROP TABLE IF EXISTS `pre_job_quotationterms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pre_job_quotationterms` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `content` longtext,
  `updated_at` datetime(6) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pre_job_quotationterms`
--

LOCK TABLES `pre_job_quotationterms` WRITE;
/*!40000 ALTER TABLE `pre_job_quotationterms` DISABLE KEYS */;
INSERT INTO `pre_job_quotationterms` VALUES (1,'<h3 style=\"text-align: center; margin: 40px 0 20px; font-weight: bold; font-size: 18px;\">\n  Terms & Conditions\n</h3>\n<h4 style=\"margin-bottom: 20px; font-weight: bold;\">\n  Calibration Service General Terms and Conditions\n</h4>\n\n<ul style=\"list-style-type: disc; padding-left: 25px; line-height: 1.9; font-size: 14px;\">\n  <li>Following the calibration of each instrument, a comprehensive calibration report will be generated. Prime Innovation adheres to the fundamental principle governing the utilization of its accreditation logo. The accreditation logo serves as an assurance to the market that Prime Innovation complies with the applicable accreditation requirements. It is essential to note that the accreditation logo and the company logo of Prime Innovation are exclusively reserved for the sole use of Prime Innovation. Customers are expressly prohibited from utilizing these logos for profit, such as in advertisements on documents or commercial papers.</li>\n  \n  <li>Customers are required to communicate their tolerance limits to Prime Innovation through email, facilitated by the assigned Prime Innovation Sales representative. In instances where no tolerance limit is communicated to Prime Innovation, the manufacturer\'s tolerance limit will be implemented. In cases where customers fail to provide the tolerance limit before calibration and subsequently wish to re-calibrate with their specified tolerance, Prime Innovation will apply the same amount as originally quoted.</li>\n  \n  <li>If a unit is identified as defective and requires repair, such matters fall outside the scope of Prime Innovation\'s services. In such cases, you will be advised to reach out to the manufacturer or your respective vendor for necessary repairs. Following the completion of repairs, you are then encouraged to resubmit the unit to Prime Innovation for calibration.</li>\n  \n  <li>Prime Innovation is committed to employing calibration methods that are suitable for the specific calibration tasks undertaken. Whenever feasible, Prime Innovation will utilize methods outlined in the instrument\'s service manual. Alternatively, international, regional, or national standards will be referenced when appropriate. In some cases, Prime Innovation may also employ methods developed in-house. The method used for calibration will be clearly indicated on the test report. Nonstandard methods will only be employed with your explicit agreement. If the proposed method from your end is deemed inappropriate or outdated, Prime Innovation will promptly inform you of this determination.</li>\n  \n  <li>Normal turnaround time for Prime Innovation calibration services varies, depending on the type of Service requested and fluctuations in workload. However, 2-3 working days is normal for calibration services.</li>\n  \n  <li>Prime Innovation have free pick-up and delivery service from customer premises following to the availability of prime innovation sales team.</li>\n  \n  <li>Customers purchase order or written approval is required to start calibration.</li>\n  \n  <li>Prime Innovation will invoice completed and delivered instruments irrespective of total number of instruments in the PO. Hence customer is liable to accept the submitted partial invoices and proceed with payment.</li>\n  \n  <li>If the UUC (unit under Calibration) was found to be out of tolerance during calibration, and it will result to the rejection of the UUC, then 100% quoted rate for calibration shall be charged.</li>\n  \n  <li>Customer should provide written request in advance if conformity statement to a specification or standard (PASS/FAIL) is required and choose what decision rules to be applied.</li>\n  \n  <li><strong>PAYMENT:</strong> Payment to be made after 30 days</li>\n  \n  <li><strong>CONFIDENTIALITY:</strong> Unless the customer had made the information publicly available, or with agreement with the customer, all calibration results and documents created during the calibration of customer\'s equipment are considered proprietary information and treated as confidential. When required by law or by contractual agreement to release confidential information, Prime Innovation will inform the customer representative unless otherwise prohibited by law. Information about the customer obtained from sources other than the customer (e.g. complainant, regulators) is confidential between the customer and the laboratory. The provider (source) of this information is confidential to PRIME INNOVATION and do not share with the customer, unless agreed by the source.</li>\n  \n  <li><strong>VAT is excluded from our quotation and will be charged at 15% extra.</strong></li>\n</ul>\n\n<div style=\"margin-top: 60px; text-align: right; font-weight: bold; font-size: 15px;\">\n  For Prime Innovation Company<br>\n  Hari Krishnan M<br>\n  <em style=\"font-size: 14px;\">Head - Engineering and QA/QC</em>\n</div>','2026-02-16 06:23:03.687801',1,'2025-12-12 12:28:26.686595'),(2,'<h3 class=\"ql-align-center\"><strong>Terms &amp; Conditions</strong></h3><h4><strong>Calibration Service General Terms and Conditions</strong></h4><ul><li>Following the calibration of each instrument, a comprehensive calibration report will be generated. Prime Innovation adheres to the fundamental principle governing the utilization of its accreditation logo. The accreditation logo serves as an assurance to the market that Prime Innovation complies with the applicable accreditation requirements. It is essential to note that the accreditation logo and the company logo of Prime Innovation are exclusively reserved for the sole use of Prime Innovation. Customers are expressly prohibited from utilizing these logos for profit, such as in advertisements on documents or commercial papers.</li><li>Customers are required to communicate their tolerance limits to Prime Innovation through email, facilitated by the assigned Prime Innovation Sales representative. In instances where no tolerance limit is communicated to Prime Innovation, the manufacturer\'s tolerance limit will be implemented. In cases where customers fail to provide the tolerance limit before calibration and subsequently wish to re-calibrate with their specified tolerance, Prime Innovation will apply the same amount as originally quoted.</li><li>If a unit is identified as defective and requires repair, such matters fall outside the scope of Prime Innovation\'s services. In such cases, you will be advised to reach out to the manufacturer or your respective vendor for necessary repairs. Following the completion of repairs, you are then encouraged to resubmit the unit to Prime Innovation for calibration.</li><li>Prime Innovation is committed to employing calibration methods that are suitable for the specific calibration tasks undertaken. Whenever feasible, Prime Innovation will utilize methods outlined in the instrument\'s service manual. Alternatively, international, regional, or national standards will be referenced when appropriate. In some cases, Prime Innovation may also employ methods developed in-house. The method used for calibration will be clearly indicated on the test report. Nonstandard methods will only be employed with your explicit agreement. If the proposed method from your end is deemed inappropriate or outdated, Prime Innovation will promptly inform you of this determination.</li><li>Normal turnaround time for Prime Innovation calibration services varies, depending on the type of Service requested and fluctuations in workload. However, 2-3 working days is normal for calibration services.</li><li>Prime Innovation have free pick-up and delivery service from customer premises following to the availability of prime innovation sales team.</li><li>Customers purchase order or written approval is required to start calibration.</li><li>Prime Innovation will invoice completed and delivered instruments irrespective of total number of instruments in the PO. Hence customer is liable to accept the submitted partial invoices and proceed with payment.</li><li>If the UUC (unit under Calibration) was found to be out of tolerance during calibration, and it will result to the rejection of the UUC, then 100% quoted rate for calibration shall be charged.</li><li>Customer should provide written request in advance if conformity statement to a specification or standard (PASS/FAIL) is required and choose what decision rules to be applied.</li><li><strong>PAYMENT:</strong> Payment to be made after 60 days</li><li><strong>CONFIDENTIALITY:</strong> Unless the customer had made the information publicly available, or with agreement with the customer, all calibration results and documents created during the calibration of customer\'s equipment are considered proprietary information and treated as confidential. When required by law or by contractual agreement to release confidential information, Prime Innovation will inform the customer representative unless otherwise prohibited by law. Information about the customer obtained from sources other than the customer (e.g. complainant, regulators) is confidential between the customer and the laboratory. The provider (source) of this information is confidential to PRIME INNOVATION and do not share with the customer, unless agreed by the source.</li><li><strong>VAT is excluded from our quotation and will be charged at 15% extra.</strong></li></ul><p class=\"ql-align-right\"><strong>For Prime Innovation Company</strong></p><p class=\"ql-align-right\"><strong> Hari Krishnan M</strong></p><p class=\"ql-align-right\"><strong><em>Head - Engineering and QA/QC</em></strong></p>','2025-12-17 10:15:42.329834',0,'2025-12-17 10:15:42.329895');
/*!40000 ALTER TABLE `pre_job_quotationterms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pre_job_rfq`
--

DROP TABLE IF EXISTS `pre_job_rfq`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pre_job_rfq` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `company_name` varchar(100) DEFAULT NULL,
  `company_address` longtext,
  `company_phone` varchar(100) DEFAULT NULL,
  `company_email` varchar(254) DEFAULT NULL,
  `point_of_contact_name` varchar(100) DEFAULT NULL,
  `point_of_contact_email` varchar(254) DEFAULT NULL,
  `point_of_contact_phone` varchar(100) DEFAULT NULL,
  `due_date_for_quotation` date DEFAULT NULL,
  `rfq_status` varchar(20) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `assigned_sales_person_id` bigint DEFAULT NULL,
  `rfq_channel_id` bigint DEFAULT NULL,
  `series_number` varchar(50) DEFAULT NULL,
  `vat_applicable` tinyint(1) DEFAULT NULL,
  `email_sent` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `series_number` (`series_number`),
  KEY `pre_job_rfq_assigned_sales_perso_0de0afc4_fk_team_team` (`assigned_sales_person_id`),
  KEY `pre_job_rfq_rfq_channel_id_0873bdb4_fk_channels_rfqchannel_id` (`rfq_channel_id`),
  CONSTRAINT `pre_job_rfq_assigned_sales_perso_0de0afc4_fk_team_team` FOREIGN KEY (`assigned_sales_person_id`) REFERENCES `team_teammember` (`id`),
  CONSTRAINT `pre_job_rfq_rfq_channel_id_0873bdb4_fk_channels_rfqchannel_id` FOREIGN KEY (`rfq_channel_id`) REFERENCES `channels_rfqchannel` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=91 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pre_job_rfq`
--

LOCK TABLES `pre_job_rfq` WRITE;
/*!40000 ALTER TABLE `pre_job_rfq` DISABLE KEYS */;
INSERT INTO `pre_job_rfq` VALUES (5,'Intertek ITS Testing Services Co','Laboratory Division, KFIP- AL Jubail Port,  Kingdom of Saudi Arabia','+966 533118129','muhammad.zeeshan@intertek.com','Mr. Muhammad Zeeshan Butt','muhammad.zeeshan@intertek.com','+966 533118129','2025-12-17','Completed','2025-12-17 10:10:24.052878',2,2,'QUO-PRM-000004',0,1),(6,'AYTB','Jubail, Kingdom of Saudi Arabia','+966 013-3437700 Ext.7710','MunirAhmad@aytb.com','Mr. Munir Ahmad','MunirAhmad@aytb.com','+966 551271193','2025-12-17','Completed','2025-12-17 10:13:58.656364',2,1,'QUO-PRM-000005',0,1),(7,'Aesen Middle East. (Formerly known as  Miclyn Express Offshore)',NULL,NULL,NULL,'Mr. Dennis Kunnel Sam','dennis.sam@aesengroup.com',NULL,'2025-12-17','Completed','2025-12-17 14:38:17.414410',2,1,'QUO-PRM-000006',0,1),(8,'Aesen Middle East. (Formerly known as  Miclyn Express Offshore)',NULL,NULL,NULL,'Mr. Basharat Ali','basharat.ali@aesengroup.com',NULL,'2025-12-17','Completed','2025-12-17 14:39:13.022455',2,1,'QUO-PRM-000007',0,1),(10,'ATTIQ UR REHMAN CONT. CO.','Al-Khobar 34427, Kingdom of Saudi Arabia',NULL,NULL,'Mr. Naresh','naresh@aurcontracting.com',NULL,'2025-12-18','Completed','2025-12-20 09:17:04.884935',2,2,'QUO-PRM-000008',0,1),(11,'ATTIQ UR REHMAN CONT. CO.','Al-Khobar 34427, Kingdom of Saudi Arabia',NULL,NULL,'Mr. Naresh','naresh@aurcontracting.com',NULL,'2025-12-18','Completed','2025-12-20 09:18:03.799345',2,2,'QUO-PRM-000009',0,1),(12,'Imam Mohammad Ibn Saud Islamic  University','Riyadh, Saudi Arabia',NULL,NULL,'Mr. Raouf Hassan','rahassan@imamu.edu.sa','+966 566593033','2025-12-18','Completed','2025-12-20 09:26:46.395495',2,2,'QUO-PRM-000010',0,1),(13,'Tamimi Contracting',NULL,NULL,NULL,'Mr. John Thomas','john.thomas@tamimicontracting.com',NULL,'2025-12-18','Completed','2025-12-20 09:41:13.313255',2,1,'QUO-PRM-000011',0,1),(15,'TestCosa','Dammam, Saudi Arabia',NULL,NULL,'Mr. Bayan AlAttas','bayan@testcosa.com','+966598683583','2025-12-18','Completed','2025-12-20 09:46:42.213407',2,1,'QUO-PRM-000013',0,1),(16,'Energy Tech','Dammam   Kingdom of Saudi Arabia',NULL,NULL,'Mr. Rami Al-Omran','omranra@spsp.edu.sa','+966 0562340350','2025-12-23','Completed','2025-12-20 09:49:40.770694',2,1,'QUO-PRM-000014',0,1),(17,'Tamimi Contracting',NULL,NULL,NULL,'Mr. John Thomas','john.thomas@tamimicontracting.com',NULL,'2025-12-18','Completed','2025-12-20 09:59:29.185354',2,1,'QUO-PRM-000015',0,1),(18,'Saudi Wells Technology Co.',NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-21','Completed','2025-12-21 07:18:05.885154',2,2,'QUO-PRM-000016',0,1),(19,'SAUDI READYMIX CONCRETE COMPANY','31839 Al Dammam 31952,   Kingdom Of Saudi Arabia','+966 13 816 4998 ext 2627',NULL,'Mr. Mudassir  H. Hagalwadi',NULL,'+966 53 451 8513','2025-12-21','Completed','2025-12-21 12:30:23.521683',2,2,'QUO-PRM-000017',0,1),(20,'Majan Construction Co. LTD','P.O. Box 3500, Al Hindi Tower, 5th Floor,  KHADEM AL HARAMAIN AL SHAREFEEN  BRANCH RD. – AL Khobar - KSA.',NULL,NULL,'Mr. Chilambarasan Rajendiran','Chilambarasan.Rajendiran@douglasohi.com','+966 (0)53 413 1114','2025-12-21','Completed','2025-12-21 12:35:24.621741',2,2,'QUO-PRM-000018',0,1),(21,'AMIT Marine Limited','P.O. Box: 34712, Showroom 37, Al- Khobar, Al Sedfah, Auto Moto Complex  King Faisal Bin Abdulaziz Road, Saudi Arabia','+966 13 502 8969',NULL,'Mr. Kevin John Ninan','kevin.ninan@amitmarine.com','+966 54 059 7971','2025-12-22','Completed','2025-12-22 09:44:42.224864',2,2,'QUO-PRM-000019',0,1),(22,'ADCALES','Bldg no.7766, Additional no.4224, Aldanah  District, Al Sarqiyah, Al Jubail, Saudi Arabia',NULL,NULL,'Mr. Farheen Banu','services@adcales.com',NULL,'2025-12-22','Completed','2025-12-22 12:05:28.464975',2,1,'QUO-PRM-000020',0,1),(24,'test','Test','1234567890','marketbytesdevops@gmail.com','test','marketbytesdevops@gmail.com','1234567890','2025-12-24','Completed','2025-12-23 10:13:53.692971',3,1,'QUO-PRM-000021',0,1),(25,'test','Test','1234567890','test@gmail.com','test@gmail.com','test@gmail.com','1234567890','2025-12-24','Completed','2025-12-23 11:22:11.774848',4,2,'QUO-PRM-000022',0,1),(26,'RAPCO GROUPS','P.O.BOX 750, Ras Tanura 21041, Kingdom of  Saudi Arabia.',NULL,NULL,'Mr. Mohamed Safeer','mohamed.safeer@rapcogroups.com','+966-531214850','2025-12-22','Completed','2025-12-25 07:16:20.211648',2,1,'QUO-PRM-000023',0,1),(27,'UNITED GROUP (UNITED WAREHOUSING  AND DISTRIBUTION SERVICES - JEDDAH)',NULL,NULL,NULL,'Mr. Mohammed Aslam','maslam@unitedgroup.com.sa',NULL,'2025-12-22','Completed','2025-12-25 07:20:38.263140',2,1,'QUO-PRM-000024',0,1),(28,'UNITED GROUP (UNITED WAREHOUSING  AND DISTRIBUTION SERVICES - KHOBAR)',NULL,NULL,NULL,'Mr. Mohammed Aslam','maslam@unitedgroup.com.sa',NULL,'2025-12-22','Completed','2025-12-25 07:23:27.290323',2,2,'QUO-PRM-000025',0,1),(29,'Binzagr For Industry and Maintenance Co.','P.O.Box:10669, Jubail 31961,  Kingdom Of Saudi Arabia',NULL,NULL,'Mr. Fahat Anis','fahat.anis@bfim.com.sa','+966 0581028191','2025-12-22','Completed','2025-12-25 07:28:00.867416',2,1,'QUO-PRM-000026',0,1),(30,'AJWAD UTC COMPANY - KHOBAR',NULL,NULL,NULL,'Mr. Mohammed Aslam','maslam@unitedgroup.com.sa',NULL,'2025-12-23','Completed','2025-12-25 07:29:24.128221',2,1,'QUO-PRM-000027',0,1),(31,'Binzagr For Industry and Maintenance Co.','P.O.Box:10669, Jubail 31961,  Kingdom Of Saudi Arabia',NULL,NULL,'Mr. Fahat Anis','fahat.anis@bfim.com.sa','+966 0581028191',NULL,'Completed','2025-12-25 07:35:23.750238',2,2,'QUO-PRM-000028',0,1),(32,'Ansaldo Energia',NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-23','Completed','2025-12-25 07:49:17.792923',2,2,'QUO-PRM-000029',0,1),(34,'Gulf Horizon Industry','Dhahran, Saudi Arabia',NULL,NULL,'Mr. Zeeshan Ahmad','purchase@gulf-horizon.sa','+966 58 128 1169','2025-12-24','Completed','2025-12-25 08:07:18.398679',2,1,'QUO-PRM-000030',0,1),(35,'TestCosa','Dammam, Saudi Arabia',NULL,NULL,'Mr. Bayan AlAttas','bayan@testcosa.com','+966598683583','2025-12-24','Completed','2025-12-25 08:25:30.585833',2,1,'QUO-PRM-000031',0,1),(36,'Zamil Offshore','Jeddah Pier., Kingdom of Saudi Arabia',NULL,NULL,'Mr. Vibin Raj','wp.procurement@zamiloffshore.com','+966530735016/+966573192549','2025-12-24','Completed','2025-12-25 08:27:02.674522',2,1,'QUO-PRM-000032',0,1),(37,'RAPCO GROUPS','P.O.BOX 750, Ras Tanura 21041, Kingdom of  Saudi Arabia.',NULL,NULL,'Mr. Mohamed Safeer','mohamed.safeer@rapcogroups.com','+966-531214850','2025-12-24','Completed','2025-12-25 08:31:40.966134',2,1,'QUO-PRM-000033',0,1),(38,'TestCosa','Dammam, Saudi Arabia',NULL,NULL,'Mr. Bayan AlAttas','bayan@testcosa.com','+966598683583','2025-12-25','Completed','2025-12-25 08:35:59.693603',2,1,'QUO-PRM-000034',0,1),(39,'Saudi Wells Technology Co.',NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-25','Completed','2025-12-27 10:26:57.076032',2,2,'QUO-PRM-000035',0,1),(40,'Al Jalhami Contracting and Trading Co','2057 Al Amir Nayif BIn Abdul Aziz Al Khafji 39253 Ash Sharqiyah Saudi Arabia',NULL,NULL,NULL,NULL,NULL,'2025-12-27','Completed','2025-12-27 10:29:55.458214',2,2,'QUO-PRM-000036',0,1),(41,'Simple Solutions Trading, Industrial  Services and Maintenance Co.','20 Street, Cross Street 39, Dammam 2nd  Industrial City, Saudi Arabia',NULL,NULL,'Mr. Adnan Baig','baig@sst-sa.com','+966 (0) 55 400 8708','2025-12-27','Completed','2025-12-27 10:32:32.527115',2,1,'QUO-PRM-000037',0,1),(42,'Future optima pvt ltd','KAUSTHUBHAM,CHERTHALA,VARANADU P O,CHENGANDA','09947384437','akshaysambhu07@gmail.com','AKASH K A','akshaysambhu07@gmail.com','09947384437','2025-12-29','Completed','2025-12-29 09:12:10.124103',3,1,'QUO-PRM-000038',0,1),(43,'quest innovative','KAUSTHUBHAM,CHERTHALA,VARANADU P O,CHENGANDA','09947384437','akshaysambhu07@gmail.com','AKASH K A','akshaysambhu07@gmail.com','09947384437','2026-01-03','Completed','2025-12-30 06:50:24.491511',3,1,'QUO-PRM-000039',1,1),(45,'TEST',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Completed','2025-12-30 11:53:48.183504',2,NULL,'QUO-PRM-000040',0,1),(46,'zeroda','KAUSTHUBHAM,CHERTHALA,VARANADU P O,CHENGANDA','09947384437','akshaysambhu07@gmail.com','AKASH K A','akshaysambhu07@gmail.com','09947384437','2026-01-03','Completed','2025-12-30 12:12:04.617639',3,2,'QUO-PRM-000041',0,1),(47,'TEST','KSA',NULL,NULL,'TEST',NULL,NULL,NULL,'Completed','2025-12-30 13:17:46.392700',2,2,'QUO-PRM-000042',0,1),(48,'Simple Solutions Trading, Industrial  Services and Maintenance Co.','20 Street, Cross Street 39, Dammam 2nd  Industrial City, Saudi Arabia',NULL,NULL,'Mr. Adnan Baig','baig@sst-sa.com','+966 (0) 55 400 8708','2025-12-27','Completed','2026-01-04 06:08:17.059387',2,1,'QUO-PRM-000043',0,1),(49,'Advanced Construction Technology  Services (ACTS)','Al Khobar, Saudi Arabia',NULL,NULL,'Mr. Mohamed Sharukkhan','MSharukkhan@acts-int.com','+966 55 939 4364','2025-12-28','Completed','2026-01-04 06:16:58.624562',2,1,'QUO-PRM-000044',0,1),(50,'Zamil Industrial Coatings','116 2nd Industrial City, Dammam, Kingdom of  Saudi Arabia','+966 13-8337130 ext.2612',NULL,'Ms. Norah Alduhailan','norah.alduhailan@zamilcoating.com',NULL,'2025-12-28','Completed','2026-01-04 06:21:05.287285',2,1,'QUO-PRM-000045',0,1),(51,'ATTIQ UR REHMAN CONT. CO.','Al-Khobar 34427, Kingdom of Saudi Arabia',NULL,NULL,'Mr. Naresh','naresh@aurcontracting.com',NULL,NULL,'Completed','2026-01-04 06:23:04.733064',2,2,'QUO-PRM-000046',0,1),(52,'Abdullah Hadi Balharith & Partner Co',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Completed','2026-01-04 06:24:57.319039',2,2,'QUO-PRM-000047',0,1),(53,'Binzagr For Industry and Maintenance Co.','P.O.Box:10669, Jubail 31961,  Kingdom Of Saudi Arabia',NULL,NULL,'Mr. Fahat Anis','fahat.anis@bfim.com.sa','+966 0581028191',NULL,'Completed','2026-01-04 08:16:16.900672',2,1,'QUO-PRM-000048',0,1),(54,'Binzagr For Industry and Maintenance Co.','P.O.Box:10669, Jubail 31961,  Kingdom Of Saudi Arabia',NULL,NULL,'Mr. Fahat Anis','fahat.anis@bfim.com.sa','+966 0581028191',NULL,'Completed','2026-01-04 08:17:43.789694',2,1,'QUO-PRM-000049',0,1),(55,'Aesen Middle East. (Formerly known as  Miclyn Express Offshore)',NULL,NULL,NULL,'Mr. Basharat Ali','basharat.ali@aesengroup.com',NULL,NULL,'Completed','2026-01-04 08:22:06.624542',2,1,'QUO-PRM-000050',0,1),(56,'Al Jalhami Contracting and Trading Co','2057 Al Amir Nayif BIn Abdul Aziz Al Khafji 39253 Ash Sharqiyah Saudi Arabia',NULL,NULL,NULL,NULL,NULL,NULL,'Completed','2026-01-04 08:27:00.385891',2,1,'QUO-PRM-000051',0,1),(57,'Phuel Oil Tools Saudi Arabia Company','Near 2nd Industrial Area, Dhahran- Abqaiq  Highway, Dammam 34341-6301, Kingdom of  Saudi Arabia',NULL,NULL,'Mr. Riyas Badarudeen','riyasb@phueloiltools.com.sa',NULL,NULL,'Completed','2026-01-04 08:30:42.039470',2,2,'QUO-PRM-000052',0,1),(58,'CDI Products Arabia Industrial LLC',NULL,NULL,NULL,'Mr. Elayaraja Muthaiah','Elayaraja.muthaiah@cdiproducts.com',NULL,NULL,'Completed','2026-01-04 08:32:45.731255',2,1,'QUO-PRM-000053',0,1),(59,'RAPCO GROUPS','P.O.BOX 750, Ras Tanura 21041, Kingdom of  Saudi Arabia.',NULL,NULL,'Mr. Mohamed Safeer','mohamed.safeer@rapcogroups.com','+966-531214850',NULL,'Completed','2026-01-04 08:33:55.937691',2,1,'QUO-PRM-000054',0,1),(60,'Nesma Industrial Services Co. Ltd.','P.O. BOX: 3402, Al-Khobar 31952, K.S.A.',NULL,NULL,'Mr. Shaik Saleem','ssaleem@nesma.com','+966 538889732',NULL,'Completed','2026-01-04 08:52:41.623404',2,1,'QUO-PRM-000055',0,1),(61,'Aesen Middle East. (Formerly known as  Miclyn Express Offshore)',NULL,NULL,NULL,'Mr. Lenin Lama','lenin.lama@aesengroup.com',NULL,NULL,'Completed','2026-01-04 08:54:08.851422',2,1,'QUO-PRM-000056',0,1),(62,'RAPCO GROUPS','P.O.BOX 750, Ras Tanura 21041, Kingdom of  Saudi Arabia.',NULL,NULL,'Mr. Mohamed Safeer','mohamed.safeer@rapcogroups.com','+966-531214850',NULL,'Completed','2026-01-04 09:03:39.782567',2,1,'QUO-PRM-000057',0,1),(63,'ATTIQ UR REHMAN CONT. CO.','Al-Khobar 34427, Kingdom of Saudi Arabia',NULL,NULL,'Mr. Naresh','naresh@aurcontracting.com',NULL,NULL,'Completed','2026-01-04 09:05:19.296363',2,2,'QUO-PRM-000058',0,1),(64,'ATTIQ UR REHMAN CONT. CO.','Al-Khobar 34427, Kingdom of Saudi Arabia',NULL,NULL,'Mr. Naresh','naresh@aurcontracting.com',NULL,NULL,'Completed','2026-01-04 09:05:53.250366',2,2,'QUO-PRM-000059',0,1),(65,'ATTIQ UR REHMAN CONT. CO.','Al-Khobar 34427, Kingdom of Saudi Arabia',NULL,NULL,'Mr. Naresh','naresh@aurcontracting.com',NULL,NULL,'Completed','2026-01-04 09:06:27.192052',2,2,'QUO-PRM-000060',0,1),(66,'Binzagr For Industry and Maintenance Co.','P.O.Box:10669, Jubail 31961,  Kingdom Of Saudi Arabia',NULL,NULL,'Mr. Fahat Anis','fahat.anis@bfim.com.sa','+966 0581028191',NULL,'Completed','2026-01-04 09:08:11.828369',2,1,'QUO-PRM-000061',0,1),(67,'Majan Construction Co. LTD','P.O. Box 3500, Al Hindi Tower, 5th Floor,  KHADEM AL HARAMAIN AL SHAREFEEN  BRANCH RD. – AL Khobar - KSA.',NULL,NULL,'Mr. Chilambarasan Rajendiran','Chilambarasan.Rajendiran@douglasohi.com','+966 (0)53 413 1114',NULL,'Completed','2026-01-04 09:09:57.628682',2,2,'QUO-PRM-000062',0,1),(68,'Safety House Trading Est',NULL,NULL,NULL,'Mr. Jose Jhon',NULL,'+966 56 670 0412',NULL,'Completed','2026-01-04 09:11:57.913272',2,2,'QUO-PRM-000063',0,1),(69,'Aesen Middle East. (Formerly known as  Miclyn Express Offshore)',NULL,NULL,NULL,'Mr. Tanwir Muhammad','tanwir.muhammad@aesengroup.com',NULL,NULL,'Completed','2026-01-05 12:21:05.426633',2,1,'QUO-PRM-000064',0,1),(70,'Aesen Middle East. (Formerly known as  Miclyn Express Offshore)',NULL,NULL,NULL,'Mr. Basharat Ali','basharat.ali@aesengroup.com',NULL,NULL,'Completed','2026-01-05 12:22:02.053312',2,1,'QUO-PRM-000065',0,1),(71,'Aesen Middle East. (Formerly known as  Miclyn Express Offshore)',NULL,NULL,NULL,'Mr. Basharat Ali','basharat.ali@aesengroup.com',NULL,NULL,'Completed','2026-01-05 12:22:58.873412',2,1,'QUO-PRM-000066',0,1),(72,'Aesen Middle East. (Formerly known as  Miclyn Express Offshore)',NULL,NULL,NULL,'Mr. Basharat Ali','basharat.ali@aesengroup.com',NULL,NULL,'Completed','2026-01-05 12:23:55.019702',2,1,'QUO-PRM-000067',0,1),(73,'Zamil Industrial Coatings','116 2nd Industrial City, Dammam, Kingdom of  Saudi Arabia','+966 13-8337130 ext.2612',NULL,'Ms. Norah Alduhailan','norah.alduhailan@zamilcoating.com',NULL,NULL,'Completed','2026-01-05 12:28:43.455530',2,1,'QUO-PRM-000068',0,1),(74,'Advanced Precision for Industrial Services  LTD Co (APS)','Khalidiya | Dammam, Kingdom of Saudi Arabia  PO Box: 1769 | Zip Code: 32225',NULL,NULL,'Mr. Abdul Mannan','mannan@aps-sa.com',NULL,NULL,'Completed','2026-01-05 12:31:02.856353',2,2,'QUO-PRM-000069',0,1),(75,'zeroda','KAUSTHUBHAM,CHERTHALA,VARANADU P O,CHENGANDA','09947384437','akshaysambhu07@gmail.com','AKASH K A','akshaysambhu07@gmail.com','09947384437','2026-01-08','Completed','2026-01-06 09:39:40.033425',3,1,'QUO-PRM-000070',0,1),(76,'Binzagr For Industry and Maintenance Co.','P.O.Box:10669, Jubail 31961,  Kingdom Of Saudi Arabia',NULL,NULL,'Mr. Fahat Anis','fahat.anis@bfim.com.sa','+966 0581028191',NULL,'Completed','2026-01-06 12:51:13.324533',2,2,'QUO-PRM-000071',0,1),(77,'Expertise','P.O. Box 10353, Al Jubail 31961, Saudi Arabia',NULL,NULL,NULL,'m.kashif@expertindus.com',NULL,NULL,'Completed','2026-01-12 07:05:38.081582',2,NULL,'QUO-PRM-000072',0,1),(78,'Zamil Industrial Coatings','116 2nd Industrial City, Dammam, Kingdom of  Saudi Arabia','+966 13-8337130 ext.2612',NULL,'Ms. Norah Alduhailan','norah.alduhailan@zamilcoating.com',NULL,NULL,'Completed','2026-01-12 07:07:25.256565',2,1,'QUO-PRM-000073',0,1),(79,'Binzagr For Industry and Maintenance Co.','P.O.Box:10669, Jubail 31961,  Kingdom Of Saudi Arabia',NULL,NULL,'Mr. Fahat Anis','fahat.anis@bfim.com.sa','+966 0581028191',NULL,'Completed','2026-01-12 07:13:19.970054',2,1,'QUO-PRM-000074',0,1),(80,'Advanced Construction Technology  Services (ACTS)','Al Khobar, Saudi Arabia',NULL,NULL,'Mr. Mohamed Sharukkhan','MSharukkhan@acts-int.com','+966 55 939 4364',NULL,'Completed','2026-01-12 07:15:33.973515',2,1,'QUO-PRM-000075',0,1),(81,'ERAM HYDRAULICS','148 Cross , 67th Cross Road | 2nd Industrial City  |PO Box: 95589 | Dammam 3195 | Saudi Arabia',NULL,NULL,'Mr. Mohammed Mujahid','proc1@eramhydraulics.com','+966 54 240 1731',NULL,'Completed','2026-01-12 07:23:02.978887',2,2,'QUO-PRM-000076',0,1),(82,'CDI Products Arabia Industrial LLC',NULL,NULL,NULL,'Mr. Elayaraja Muthaiah','Elayaraja.muthaiah@cdiproducts.com',NULL,NULL,'Completed','2026-01-12 07:25:52.670741',2,1,'QUO-PRM-000077',0,1),(83,'Al Jalhami Contracting and Trading Co','2057 Al Amir Nayif BIn Abdul Aziz Al Khafji 39253 Ash Sharqiyah Saudi Arabia',NULL,NULL,NULL,NULL,NULL,NULL,'Completed','2026-01-12 07:29:30.159272',2,2,'QUO-PRM-000078',0,1),(84,'Arabian Machinery & Heavy Equipment  Co.','P.O.Box-2884, Al Khobar 31952, Kingdom of  Saudi Arabia','+966 (0) 13 8970444 Ext. 506',NULL,'Mr. Chandrakanth Ramayya','chandrakanth.ramayya@amhec.com','+966 (0) 550170364',NULL,'Completed','2026-01-12 07:31:58.978762',2,1,'QUO-PRM-000079',0,1),(85,'Zamil Industrial Coatings','116 2nd Industrial City, Dammam, Kingdom of  Saudi Arabia','+966 13-8337130 ext.2612',NULL,'Ms. Norah Alduhailan','norah.alduhailan@zamilcoating.com',NULL,NULL,'Completed','2026-01-21 12:18:41.905274',2,1,'QUO-PRM-000080',0,1),(86,'Frontier Group International W.L.L.','Building No. 3964, Prince Saud Ibn Muhammad  Ibn Muqrin, Tuwaiq Dist, Zip Code 14931.  Riyadh, Kingdom of Saudi Arabia','+974 4450-4339',NULL,'Mr. Mohammed Sohail','liftingcoordinator@fgi-me.com','+966 500639563',NULL,'Completed','2026-01-21 12:22:13.900526',2,1,'QUO-PRM-000081',0,1),(87,'Hadi Hammad Al Hammam Holding Co','117 Prince Naif Street,  P.O. Box 3,   Rahima 319413,  Eastern Province,  Kingdom of Saudi Arabia',NULL,NULL,NULL,NULL,NULL,NULL,'Completed','2026-01-21 12:24:21.666958',2,2,'QUO-PRM-000082',0,1),(88,'Intertek ITS Testing Services Co','Laboratory Division, KFIP- AL Jubail Port,  Kingdom of Saudi Arabia','+966 533118129','muhammad.zeeshan@intertek.com','Mr. Muhammad Zeeshan Butt','muhammad.zeeshan@intertek.com','+966 533118129',NULL,'Completed','2026-01-21 12:26:54.380062',2,2,'QUO-PRM-000083',0,1),(89,'NAMARIQ','Jeddah, Saudi Arabia',NULL,NULL,NULL,NULL,NULL,NULL,'Completed','2026-01-21 12:29:58.368668',2,NULL,'QUO-PRM-000084',0,1),(90,'Trial','NA','1234','danny@primearabiagroup.com','Trial','danny@primearabiagroup.com','1234','2026-02-11','Completed','2026-02-10 12:37:01.797810',5,1,'QUO-PRM-000085',1,1);
/*!40000 ALTER TABLE `pre_job_rfq` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pre_job_rfqitem`
--

DROP TABLE IF EXISTS `pre_job_rfqitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pre_job_rfqitem` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `quantity` int unsigned DEFAULT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `item_id` bigint DEFAULT NULL,
  `rfq_id` bigint NOT NULL,
  `unit_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pre_job_rfqitem_item_id_9a2db644_fk_item_item_id` (`item_id`),
  KEY `pre_job_rfqitem_rfq_id_da6461e5_fk_pre_job_rfq_id` (`rfq_id`),
  KEY `pre_job_rfqitem_unit_id_5b7b7a40_fk_unit_unit_id` (`unit_id`),
  CONSTRAINT `pre_job_rfqitem_item_id_9a2db644_fk_item_item_id` FOREIGN KEY (`item_id`) REFERENCES `item_item` (`id`),
  CONSTRAINT `pre_job_rfqitem_rfq_id_da6461e5_fk_pre_job_rfq_id` FOREIGN KEY (`rfq_id`) REFERENCES `pre_job_rfq` (`id`),
  CONSTRAINT `pre_job_rfqitem_unit_id_5b7b7a40_fk_unit_unit_id` FOREIGN KEY (`unit_id`) REFERENCES `unit_unit` (`id`),
  CONSTRAINT `pre_job_rfqitem_chk_1` CHECK ((`quantity` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=2801 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pre_job_rfqitem`
--

LOCK TABLES `pre_job_rfqitem` WRITE;
/*!40000 ALTER TABLE `pre_job_rfqitem` DISABLE KEYS */;
INSERT INTO `pre_job_rfqitem` VALUES (119,5,100.00,27,5,2),(120,1,150.00,28,5,2),(121,1,135.00,29,5,2),(184,20,75.00,30,6,2),(185,5,25.00,31,6,2),(186,5,150.00,32,6,2),(187,20,100.00,33,6,2),(188,5,300.00,34,6,2),(189,2,100.00,35,6,2),(190,1,150.00,36,6,2),(191,1,90.00,37,6,2),(192,4,100.00,38,6,2),(193,3,150.00,39,6,2),(194,1,100.00,40,6,2),(195,10,65.00,41,6,2),(196,2,50.00,42,6,2),(197,5,50.00,43,6,2),(198,1,100.00,44,6,2),(199,40,50.00,45,6,2),(200,20,75.00,46,6,2),(201,12,100.00,47,6,2),(202,15,90.00,48,6,2),(203,1,90.00,49,6,2),(204,20,65.00,50,6,2),(205,5,150.00,51,6,2),(206,2,150.00,52,6,2),(207,4,150.00,53,6,2),(208,2,150.00,54,6,2),(209,3,150.00,55,6,2),(210,20,75.00,56,6,2),(211,10,150.00,57,6,2),(212,3,400.00,58,6,2),(213,40,100.00,59,6,2),(214,10,100.00,60,6,2),(243,1,850.00,61,7,2),(245,1,850.00,62,8,2),(379,1,100.00,63,10,2),(385,1,100.00,64,11,2),(396,1,900.00,65,12,2),(397,1,250.00,66,12,2),(398,1,400.00,67,12,2),(399,1,400.00,68,12,2),(400,1,500.00,69,12,2),(401,2,400.00,70,12,2),(402,1,500.00,71,12,2),(403,3,200.00,72,12,2),(404,1,500.00,73,12,2),(405,1,400.00,74,12,2),(409,100,35.00,75,13,2),(410,50,35.00,76,13,2),(411,400,35.00,77,13,2),(853,1,125.00,78,17,2),(854,1,225.00,79,17,2),(855,1,90.00,80,17,2),(856,1,90.00,81,17,2),(857,1,90.00,82,17,2),(858,2,100.00,83,17,2),(859,1,15.00,84,17,2),(860,1,150.00,85,17,2),(861,1,100.00,86,17,2),(862,1,25.00,87,17,2),(863,2,135.00,88,17,2),(864,2,90.00,89,17,2),(865,1,135.00,88,17,2),(866,1,100.00,90,17,2),(867,1,125.00,91,17,2),(868,9,90.00,92,17,2),(869,46,35.00,75,17,2),(870,6,150.00,93,17,2),(871,1,150.00,94,17,2),(872,1,50.00,95,17,2),(873,4,180.00,96,17,2),(874,6,35.00,76,17,2),(875,2,90.00,97,17,2),(876,1,90.00,98,17,2),(877,2,90.00,99,17,2),(878,7,50.00,1,17,2),(879,1,65.00,100,17,2),(880,1,65.00,101,17,2),(881,1,65.00,102,17,2),(882,1,65.00,103,17,2),(883,1,65.00,104,17,2),(884,1,65.00,105,17,2),(885,1,65.00,106,17,2),(886,1,65.00,107,17,2),(887,5,75.00,108,17,2),(888,225,35.00,77,17,2),(889,4,50.00,109,17,2),(890,1,50.00,110,17,2),(891,1,25.00,111,17,2),(892,3,135.00,112,17,2),(893,1,20.00,113,17,2),(894,1,200.00,114,17,2),(895,1,180.00,115,17,2),(896,1,135.00,116,17,2),(908,1,75.00,117,15,2),(909,1,75.00,118,15,2),(910,1,150.00,119,15,2),(911,1,150.00,120,15,2),(912,1,150.00,121,15,2),(913,4,75.00,122,15,2),(914,3,75.00,123,15,2),(915,1,150.00,124,15,2),(916,1,75.00,125,15,2),(917,1,90.00,126,15,2),(918,1,75.00,127,15,2),(951,6,300.00,128,16,2),(952,2,650.00,129,16,2),(953,11,35.00,130,16,2),(954,10,100.00,131,16,2),(955,2,100.00,132,16,2),(956,4,150.00,133,16,2),(957,3,650.00,134,16,2),(958,2,150.00,135,16,2),(959,1,150.00,136,16,2),(960,9,150.00,137,16,2),(961,4,100.00,138,16,2),(962,4,100.00,139,16,2),(963,4,100.00,140,16,2),(964,3,100.00,141,16,2),(965,4,100.00,142,16,2),(966,5,150.00,143,16,2),(967,3,150.00,144,16,2),(968,10,150.00,145,16,2),(969,11,150.00,146,16,2),(970,10,150.00,147,16,2),(971,9,150.00,148,16,2),(972,8,150.00,149,16,2),(973,9,150.00,150,16,2),(974,8,150.00,151,16,2),(975,13,100.00,152,16,2),(976,2,20.00,153,16,2),(977,4,20.00,154,16,2),(978,5,20.00,155,16,2),(979,6,20.00,156,16,2),(980,13,20.00,157,16,2),(981,3,20.00,158,16,2),(982,1,200.00,159,16,2),(1163,2,200.00,10,18,2),(1164,2,200.00,94,18,2),(1165,7,100.00,1,18,2),(1166,1,100.00,160,18,2),(1167,2,150.00,161,18,2),(1168,5,200.00,162,18,2),(1169,1,350.00,163,18,2),(1170,1,200.00,164,18,2),(1171,1,200.00,165,18,2),(1172,2,0.00,166,18,2),(1173,1,0.00,167,18,2),(1181,1,90.00,168,19,2),(1182,1,90.00,169,19,2),(1183,1,90.00,170,19,2),(1184,1,90.00,171,19,2),(1185,1,90.00,172,19,2),(1186,1,90.00,173,19,2),(1187,1,90.00,174,19,2),(1196,2,85.00,76,20,2),(1197,1,140.00,175,20,2),(1198,2,50.00,176,20,2),(1199,4,160.00,177,20,2),(1200,1,150.00,178,20,2),(1201,1,50.00,1,20,2),(1202,1,90.00,179,20,2),(1203,1,90.00,180,20,2),(1215,3,75.00,1,21,2),(1216,1,100.00,181,21,2),(1217,1,150.00,182,21,2),(1218,2,150.00,183,21,2),(1219,2,100.00,184,21,2),(1221,1,305.00,175,22,2),(1228,4,150.00,1,24,1),(1231,4,150.00,1,25,1),(1234,20,40.00,185,26,2),(1253,25,200.00,186,27,2),(1254,2,200.00,187,27,2),(1255,7,200.00,188,27,2),(1256,8,200.00,189,27,2),(1257,3,200.00,190,27,2),(1258,2,200.00,182,27,2),(1265,2,200.00,191,28,2),(1266,5,200.00,187,28,2),(1267,9,200.00,188,28,2),(1268,3,200.00,189,28,2),(1269,5,200.00,190,28,2),(1270,2,200.00,182,28,2),(1282,1,100.00,192,29,2),(1283,1,100.00,78,29,2),(1284,2,100.00,193,29,2),(1285,1,100.00,194,29,2),(1286,1,125.00,195,29,2),(1288,2,200.00,189,30,2),(1309,2,100.00,196,31,2),(1310,2,100.00,80,31,2),(1311,2,100.00,193,31,2),(1312,2,100.00,197,31,2),(1313,1,100.00,198,31,2),(1314,2,150.00,85,31,2),(1315,9,65.00,1,31,2),(1316,6,75.00,199,31,2),(1317,13,75.00,200,31,2),(1318,2,200.00,201,31,2),(1327,81,50.00,202,32,2),(1328,2,50.00,203,32,2),(1329,3,50.00,204,32,2),(1330,1,100.00,205,32,2),(1420,1,75.00,206,34,2),(1421,1,75.00,207,34,2),(1422,1,75.00,208,34,2),(1423,1,75.00,209,34,2),(1424,1,75.00,210,34,2),(1425,1,150.00,211,34,2),(1426,1,150.00,211,34,2),(1427,1,75.00,212,34,2),(1428,1,75.00,213,34,2),(1429,1,75.00,214,34,2),(1430,1,75.00,215,34,2),(1431,1,75.00,216,34,2),(1432,1,75.00,217,34,2),(1433,1,75.00,212,34,2),(1434,1,75.00,218,34,2),(1435,1,75.00,219,34,2),(1436,1,75.00,220,34,2),(1437,1,75.00,221,34,2),(1438,1,75.00,222,34,2),(1442,4,100.00,223,35,2),(1444,8,1000.00,224,36,2),(1461,1,85.00,225,37,2),(1462,1,85.00,226,37,2),(1463,1,85.00,227,37,2),(1464,1,85.00,228,37,2),(1523,1,50.00,229,38,2),(1524,1,50.00,160,38,2),(1525,1,75.00,199,38,2),(1526,1,100.00,230,38,2),(1527,1,200.00,231,38,2),(1528,1,200.00,232,38,2),(1529,1,200.00,233,38,2),(1530,1,150.00,234,38,2),(1531,1,150.00,235,38,2),(1532,1,150.00,236,38,2),(1533,1,150.00,237,38,2),(1534,1,350.00,238,38,2),(1535,1,350.00,239,38,2),(1536,1,350.00,240,38,2),(1537,1,350.00,241,38,2),(1538,1,350.00,242,38,2),(1539,1,350.00,243,38,2),(1540,1,350.00,244,38,2),(1541,1,500.00,245,38,2),(1542,1,500.00,246,38,2),(1543,1,500.00,247,38,2),(1544,1,1000.00,248,38,2),(1545,1,1000.00,249,38,2),(1546,1,90.00,250,38,2),(1547,1,50.00,251,38,2),(1548,1,90.00,252,38,2),(1549,1,150.00,253,38,2),(1550,1,150.00,254,38,2),(1551,1,125.00,255,38,2),(1584,4,200.00,259,40,2),(1585,2,200.00,78,40,2),(1586,2,75.00,199,40,2),(1587,8,50.00,1,40,2),(1588,1,155.00,260,40,2),(1589,1,180.00,85,40,2),(1590,1,200.00,261,40,2),(1591,7,200.00,262,40,2),(1592,1,200.00,263,40,2),(1593,1,750.00,264,40,2),(1594,1,750.00,265,40,2),(1600,4,50.00,266,41,2),(1601,1,50.00,267,41,2),(1602,2,50.00,268,41,2),(1603,1,50.00,269,41,2),(1604,3,50.00,270,41,2),(1674,4,150.00,1,42,1),(1675,2,120.00,2,42,1),(1676,5,150.00,10,42,1),(1677,2,1200.00,16,42,1),(1678,NULL,NULL,NULL,42,NULL),(1720,2,150.00,161,39,2),(1721,6,225.00,256,39,2),(1722,19,100.00,1,39,2),(1723,2,500.00,257,39,2),(1724,1,350.00,258,39,2),(1739,4,150.00,1,43,1),(1740,3,1200.00,7,43,1),(1741,3,120.00,23,43,3),(1742,5,120.00,278,43,4),(1743,4,120.00,1,43,1),(1747,1,75.00,271,45,2),(1751,4,150.00,1,46,1),(1755,1,75.00,1,47,2),(1907,4,50.00,283,48,2),(1908,1,50.00,284,48,2),(1909,2,50.00,285,48,2),(1910,1,50.00,286,48,2),(1911,3,50.00,287,48,2),(1960,1,100.00,288,49,2),(1961,1,100.00,289,49,2),(1962,1,100.00,290,49,2),(1963,1,100.00,291,49,2),(1964,1,100.00,292,49,2),(1965,1,100.00,293,49,2),(1966,1,100.00,294,49,2),(1967,1,100.00,295,49,2),(1968,1,100.00,296,49,2),(1969,1,100.00,297,49,2),(1970,1,100.00,298,49,2),(1971,1,100.00,299,49,2),(1972,1,100.00,300,49,2),(1973,1,100.00,301,49,2),(1974,1,100.00,302,49,2),(1975,1,100.00,303,49,2),(1976,1,100.00,304,49,2),(1977,1,100.00,305,49,2),(1978,1,200.00,306,49,2),(1979,1,200.00,307,49,2),(1980,1,200.00,308,49,2),(1981,1,75.00,309,49,2),(1982,1,100.00,182,49,2),(1983,1,75.00,310,49,2),(2016,2,75.00,311,50,2),(2017,1,75.00,312,50,2),(2018,1,90.00,313,50,2),(2019,6,90.00,314,50,2),(2020,1,90.00,315,50,2),(2021,1,90.00,316,50,2),(2022,2,75.00,317,50,2),(2023,1,75.00,318,50,2),(2024,1,75.00,319,50,2),(2025,1,75.00,320,50,2),(2026,1,75.00,321,50,2),(2027,1,350.00,322,50,2),(2028,1,75.00,323,50,2),(2029,1,75.00,324,50,2),(2030,1,75.00,325,50,2),(2031,1,75.00,326,50,2),(2034,1,135.00,327,51,2),(2039,6,35.00,328,52,2),(2040,7,75.00,329,52,2),(2055,1,100.00,78,53,2),(2056,2,100.00,193,53,2),(2057,1,100.00,330,53,2),(2058,1,100.00,196,53,2),(2059,3,65.00,1,53,2),(2060,2,75.00,199,53,2),(2061,1,200.00,201,53,2),(2082,1,100.00,193,54,2),(2083,1,100.00,330,54,2),(2084,1,100.00,80,54,2),(2085,2,100.00,196,54,2),(2086,1,150.00,85,54,2),(2087,5,65.00,1,54,2),(2088,3,75.00,199,54,2),(2089,7,75.00,262,54,2),(2090,1,200.00,201,54,2),(2091,1,100.00,197,54,2),(2094,1,850.00,61,55,2),(2097,28,50.00,1,56,2),(2102,13,100.00,1,57,2),(2103,5,150.00,161,57,2),(2110,1,400.00,331,58,2),(2111,1,125.00,332,58,2),(2112,1,125.00,326,58,2),(2115,1,40.00,333,59,2),(2200,1,90.00,334,60,2),(2201,1,90.00,10,60,2),(2202,1,100.00,335,60,2),(2203,1,50.00,336,60,2),(2204,1,50.00,337,60,2),(2205,1,50.00,338,60,2),(2206,1,50.00,339,60,2),(2207,1,75.00,340,60,2),(2208,1,75.00,341,60,2),(2209,1,75.00,342,60,2),(2210,1,75.00,343,60,2),(2211,1,75.00,344,60,2),(2212,1,75.00,345,60,2),(2213,1,50.00,346,60,2),(2214,1,50.00,347,60,2),(2215,1,50.00,348,60,2),(2216,1,70.00,349,60,2),(2217,1,50.00,350,60,2),(2218,1,50.00,351,60,2),(2219,1,70.00,352,60,2),(2220,1,75.00,353,60,2),(2221,1,90.00,354,60,2),(2222,1,70.00,355,60,2),(2223,1,70.00,356,60,2),(2224,1,40.00,357,60,2),(2225,1,85.00,358,60,2),(2226,1,50.00,359,60,2),(2227,1,50.00,360,60,2),(2228,1,50.00,361,60,2),(2229,1,75.00,362,60,2),(2230,1,50.00,363,60,2),(2231,1,70.00,364,60,2),(2232,1,50.00,365,60,2),(2233,1,40.00,366,60,2),(2234,1,40.00,367,60,2),(2235,1,40.00,368,60,2),(2236,1,40.00,369,60,2),(2237,1,50.00,370,60,2),(2238,1,90.00,10,60,2),(2239,1,40.00,371,60,2),(2240,1,50.00,372,60,2),(2241,1,50.00,373,60,2),(2244,1,250.00,374,61,2),(2251,1,125.00,375,62,2),(2252,1,125.00,376,62,2),(2253,1,125.00,377,62,2),(2256,1,200.00,378,63,2),(2263,1,120.00,383,64,2),(2266,3,200.00,259,65,2),(2295,8,100.00,196,66,2),(2296,5,100.00,80,66,2),(2297,5,100.00,193,66,2),(2298,3,100.00,197,66,2),(2299,1,100.00,198,66,2),(2300,4,150.00,85,66,2),(2301,21,65.00,1,66,2),(2302,16,75.00,199,66,2),(2303,22,75.00,200,66,2),(2304,5,200.00,201,66,2),(2305,1,100.00,330,66,2),(2306,1,650.00,379,66,2),(2307,1,100.00,78,66,2),(2308,1,125.00,380,66,2),(2317,1,160.00,177,67,2),(2318,2,50.00,176,67,2),(2319,1,85.00,76,67,2),(2320,1,140.00,175,67,2),(2325,1,850.00,381,68,2),(2326,1,80.00,382,68,2),(2333,1,850.00,384,69,2),(2336,1,850.00,385,70,2),(2339,1,850.00,385,71,2),(2342,1,850.00,385,72,2),(2348,1,65.00,386,73,2),(2353,4,200.00,387,74,2),(2354,11,150.00,112,74,2),(2359,4,150.00,1,75,1),(2360,4,160.00,2,75,1),(2388,2,100.00,82,76,2),(2389,2,100.00,197,76,2),(2390,1,200.00,201,76,2),(2391,1,100.00,193,76,2),(2392,5,65.00,1,76,2),(2393,4,75.00,199,76,2),(2394,8,75.00,200,76,2),(2395,1,100.00,388,76,2),(2396,2,100.00,330,76,2),(2499,1,250.00,389,77,2),(2500,1,250.00,390,77,2),(2501,1,250.00,391,77,2),(2502,1,250.00,392,77,2),(2503,1,250.00,393,77,2),(2504,1,250.00,394,77,2),(2505,1,250.00,395,77,2),(2506,1,250.00,396,77,2),(2507,1,250.00,397,77,2),(2508,1,250.00,398,77,2),(2509,1,250.00,399,77,2),(2510,1,250.00,400,77,2),(2511,1,250.00,401,77,2),(2512,1,250.00,402,77,2),(2513,1,250.00,403,77,2),(2514,1,250.00,404,77,2),(2517,1,90.00,313,78,2),(2534,6,75.00,405,79,2),(2535,5,75.00,406,79,2),(2536,5,75.00,407,79,2),(2537,1,75.00,179,79,2),(2538,1,75.00,408,79,2),(2539,1,150.00,409,79,2),(2540,1,125.00,410,79,2),(2541,1,150.00,411,79,2),(2550,1,180.00,412,80,2),(2551,1,180.00,413,80,2),(2552,1,200.00,414,80,2),(2553,1,300.00,415,80,2),(2556,10,50.00,1,81,2),(2611,1,100.00,416,82,2),(2612,1,100.00,417,82,2),(2613,1,100.00,417,82,2),(2614,1,100.00,417,82,2),(2615,1,250.00,418,82,2),(2616,1,400.00,419,82,2),(2617,1,100.00,420,82,2),(2618,1,100.00,421,82,2),(2619,1,100.00,417,82,2),(2620,1,100.00,422,82,2),(2621,1,100.00,422,82,2),(2622,1,100.00,423,82,2),(2623,1,100.00,424,82,2),(2624,1,90.00,425,82,2),(2625,1,100.00,420,82,2),(2626,1,100.00,426,82,2),(2627,1,100.00,426,82,2),(2628,1,100.00,426,82,2),(2629,1,100.00,426,82,2),(2630,1,100.00,426,82,2),(2631,1,100.00,426,82,2),(2632,1,100.00,426,82,2),(2633,1,250.00,427,82,2),(2634,1,250.00,428,82,2),(2635,1,400.00,429,82,2),(2636,1,100.00,430,82,2),(2637,1,100.00,417,82,2),(2658,38,150.00,431,83,2),(2659,1,75.00,432,83,2),(2660,1,90.00,433,83,2),(2661,1,200.00,434,83,2),(2662,2,150.00,435,83,2),(2663,34,50.00,1,83,2),(2664,6,200.00,259,83,2),(2665,2,400.00,379,83,2),(2666,2,200.00,78,83,2),(2667,1,200.00,436,83,2),(2674,4,65.00,437,84,2),(2675,1,65.00,438,84,2),(2676,1,65.00,439,84,2),(2705,1,75.00,440,85,2),(2706,1,90.00,441,85,2),(2707,1,90.00,441,85,2),(2722,1,100.00,442,86,2),(2723,1,100.00,443,86,2),(2724,1,125.00,444,86,2),(2725,1,100.00,445,86,2),(2726,1,100.00,446,86,2),(2727,1,100.00,447,86,2),(2728,1,350.00,448,86,2),(2735,1,150.00,449,87,2),(2736,1,80.00,432,87,2),(2737,1,75.00,199,87,2),(2744,2,135.00,450,88,2),(2745,1,150.00,28,88,2),(2746,1,135.00,29,88,2),(2759,1,100.00,451,89,2),(2760,1,100.00,452,89,2),(2761,1,200.00,453,89,2),(2762,1,200.00,454,89,2),(2763,1,300.00,455,89,2),(2764,1,150.00,456,89,2),(2797,4,150.00,1,90,1),(2798,1,50.00,457,90,1),(2799,2,50.00,458,90,1),(2800,3,100.00,459,90,1);
/*!40000 ALTER TABLE `pre_job_rfqitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `series_numberseries`
--

DROP TABLE IF EXISTS `series_numberseries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `series_numberseries` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `series_name` varchar(100) NOT NULL,
  `prefix` varchar(50) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `series_name` (`series_name`),
  UNIQUE KEY `prefix` (`prefix`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `series_numberseries`
--

LOCK TABLES `series_numberseries` WRITE;
/*!40000 ALTER TABLE `series_numberseries` DISABLE KEYS */;
INSERT INTO `series_numberseries` VALUES (3,'Quotation','QUO-PRM','2025-12-12 11:34:44.276916','2025-12-12 11:34:44.276936'),(4,'Work Order','WO-PRM','2025-12-12 11:34:55.681055','2025-12-12 11:34:55.681081'),(5,'Delivery Note','DN-PRM','2025-12-12 11:35:02.538137','2025-12-12 11:35:02.538170');
/*!40000 ALTER TABLE `series_numberseries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_teammember`
--

DROP TABLE IF EXISTS `team_teammember`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_teammember` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `email` varchar(254) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_teammember`
--

LOCK TABLES `team_teammember` WRITE;
/*!40000 ALTER TABLE `team_teammember` DISABLE KEYS */;
INSERT INTO `team_teammember` VALUES (1,'Narayanan','Sales','allseasonholding@gmail.com','2025-12-12 11:43:36.845586'),(2,'Faasil','Sales','sales@primearabiagroup.com','2025-12-12 11:44:04.815371'),(3,'Ajay','Test','marketbytesdevops@gmail.com','2025-12-12 11:44:19.281367'),(4,'akshay','work','akshaysambhu07@gmail.com','2025-12-15 04:59:11.664269'),(5,'Steve','Sales Engineer','steve@primearabiagroup.com','2026-02-10 12:30:41.329812');
/*!40000 ALTER TABLE `team_teammember` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_technician`
--

DROP TABLE IF EXISTS `team_technician`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_technician` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `email` varchar(254) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_technician`
--

LOCK TABLES `team_technician` WRITE;
/*!40000 ALTER TABLE `team_technician` DISABLE KEYS */;
INSERT INTO `team_technician` VALUES (1,'Abhiram','Calibration','calibration@primearabiagroup.com','2025-12-12 11:44:54.677370'),(2,'Mahesh','Calibration','primeinnovation3@gmail.com','2025-12-12 11:45:10.083556');
/*!40000 ALTER TABLE `team_technician` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `unit_unit`
--

DROP TABLE IF EXISTS `unit_unit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `unit_unit` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `unit_unit`
--

LOCK TABLES `unit_unit` WRITE;
/*!40000 ALTER TABLE `unit_unit` DISABLE KEYS */;
INSERT INTO `unit_unit` VALUES (1,'Pcs','2025-12-12 11:45:44.464234'),(2,'NOS','2025-12-17 10:09:58.548989'),(3,'celsuis','2025-12-30 06:52:57.944612'),(4,'faranheat','2025-12-30 06:54:45.411022'),(5,'test','2025-12-30 07:25:27.843332');
/*!40000 ALTER TABLE `unit_unit` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-15 13:04:34
