-- MySQL dump 10.13  Distrib 8.0.41, for Linux (x86_64)
--
-- Host: localhost    Database: prime_db
-- ------------------------------------------------------
-- Server version	8.0.41

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
INSERT INTO `authapp_permission` VALUES (1,'Dashboard',1,1,1,1,1),(2,'Profile',1,1,1,1,1),(3,'rfq',1,1,1,1,1),(4,'quotation',1,1,1,1,1),(5,'purchase_orders',1,1,1,1,1),(6,'processing_work_orders',1,1,1,1,1),(7,'manager_approval',1,1,1,1,1),(8,'delivery',1,1,1,1,1),(9,'pending_invoices',1,1,1,1,1),(10,'raised_invoices',1,1,1,1,1),(11,'processed_invoices',1,1,1,1,1),(12,'view_reports',1,0,0,0,1),(13,'due_date_reports',1,0,0,0,1),(14,'series',1,1,1,1,1),(15,'rfq_channel',1,1,1,1,1),(16,'item',1,1,1,1,1),(17,'unit',1,1,1,1,1),(18,'team',1,1,1,1,1),(19,'users',1,1,1,1,1),(20,'roles',1,1,1,1,1),(21,'permissions',1,1,1,1,1),(22,'pending_deliveries',1,1,1,1,1),(23,'declined_work_orders',1,1,1,1,1),(24,'pricing',1,1,1,1,1),(25,'Dashboard',1,0,0,0,2),(26,'Profile',1,0,0,0,2),(27,'rfq',1,0,0,0,2),(28,'quotation',1,0,0,0,2),(29,'purchase_orders',1,0,0,0,2),(30,'processing_work_orders',1,0,0,0,2),(31,'manager_approval',1,0,0,0,2),(32,'delivery',1,0,0,0,2),(33,'pending_invoices',1,0,0,0,2),(34,'raised_invoices',1,0,0,0,2),(35,'processed_invoices',1,0,0,0,2),(36,'view_reports',1,0,0,0,2),(37,'due_date_reports',1,0,0,0,2),(38,'series',1,0,0,0,2),(39,'rfq_channel',1,0,0,0,2),(40,'item',1,0,0,0,2),(41,'unit',1,0,0,0,2),(42,'team',1,0,0,0,2),(43,'users',1,0,0,0,2),(44,'roles',1,0,0,0,2),(45,'permissions',1,0,0,0,2),(46,'pending_deliveries',1,0,0,0,2),(47,'declined_work_orders',1,0,0,0,2),(48,'pricing',1,0,0,0,2),(49,'Dashboard',1,0,0,0,3),(50,'Profile',1,0,0,0,3),(51,'rfq',1,0,0,0,3),(52,'quotation',1,0,0,0,3),(53,'purchase_orders',1,0,0,0,3),(54,'processing_work_orders',1,0,0,0,3),(55,'manager_approval',1,0,0,0,3),(56,'delivery',1,0,0,0,3),(57,'pending_invoices',1,0,0,0,3),(58,'raised_invoices',1,0,0,0,3),(59,'processed_invoices',1,0,0,0,3),(60,'view_reports',1,0,0,0,3),(61,'due_date_reports',1,0,0,0,3),(62,'series',1,0,0,0,3),(63,'rfq_channel',1,0,0,0,3),(64,'item',1,0,0,0,3),(65,'unit',1,0,0,0,3),(66,'team',1,0,0,0,3),(67,'users',1,0,0,0,3),(68,'roles',1,0,0,0,3),(69,'permissions',1,0,0,0,3),(70,'pending_deliveries',1,0,0,0,3),(71,'declined_work_orders',1,0,0,0,3),(72,'pricing',1,0,0,0,3),(73,'Dashboard',1,0,0,0,4),(74,'Profile',1,0,0,0,4),(75,'rfq',1,0,0,0,4),(76,'quotation',1,0,0,0,4),(77,'purchase_orders',1,0,0,0,4),(78,'processing_work_orders',1,0,0,0,4),(79,'manager_approval',1,0,0,0,4),(80,'delivery',1,0,0,0,4),(81,'pending_invoices',1,0,0,0,4),(82,'raised_invoices',1,0,0,0,4),(83,'processed_invoices',1,0,0,0,4),(84,'view_reports',1,0,0,0,4),(85,'due_date_reports',1,0,0,0,4),(86,'series',1,0,0,0,4),(87,'rfq_channel',1,0,0,0,4),(88,'item',1,0,0,0,4),(89,'unit',1,0,0,0,4),(90,'team',1,0,0,0,4),(91,'users',1,0,0,0,4),(92,'roles',1,0,0,0,4),(93,'permissions',1,0,0,0,4),(94,'pending_deliveries',1,0,0,0,4),(95,'declined_work_orders',1,0,0,0,4),(96,'pricing',1,0,0,0,4);
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
INSERT INTO `django_celery_beat_periodictask` VALUES (1,'celery.backend_cleanup','celery.backend_cleanup','[]','{}',NULL,NULL,NULL,NULL,1,NULL,0,'2025-12-12 11:27:26.726854','',1,NULL,NULL,0,NULL,NULL,'{}',NULL,43200);
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
INSERT INTO `django_celery_beat_periodictasks` VALUES (1,'2025-12-12 11:27:26.727360');
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_item`
--

LOCK TABLES `item_item` WRITE;
/*!40000 ALTER TABLE `item_item` DISABLE KEYS */;
INSERT INTO `item_item` VALUES (1,'Pressure Gauge','2025-12-12 11:45:44.456290');
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_execution_workorder`
--

LOCK TABLES `job_execution_workorder` WRITE;
/*!40000 ALTER TABLE `job_execution_workorder` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_execution_workorderitem`
--

LOCK TABLES `job_execution_workorderitem` WRITE;
/*!40000 ALTER TABLE `job_execution_workorderitem` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pre_job_purchaseorder`
--

LOCK TABLES `pre_job_purchaseorder` WRITE;
/*!40000 ALTER TABLE `pre_job_purchaseorder` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pre_job_purchaseorderitem`
--

LOCK TABLES `pre_job_purchaseorderitem` WRITE;
/*!40000 ALTER TABLE `pre_job_purchaseorderitem` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pre_job_quotation`
--

LOCK TABLES `pre_job_quotation` WRITE;
/*!40000 ALTER TABLE `pre_job_quotation` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pre_job_quotationitem`
--

LOCK TABLES `pre_job_quotationitem` WRITE;
/*!40000 ALTER TABLE `pre_job_quotationitem` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pre_job_quotationterms`
--

LOCK TABLES `pre_job_quotationterms` WRITE;
/*!40000 ALTER TABLE `pre_job_quotationterms` DISABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pre_job_rfq`
--

LOCK TABLES `pre_job_rfq` WRITE;
/*!40000 ALTER TABLE `pre_job_rfq` DISABLE KEYS */;
INSERT INTO `pre_job_rfq` VALUES (1,'MarketBytes','Test','1234567890','marketbytesdevops@gmail.com','Test','marketbytesdevops@gmail.com','1234567890','2025-12-13','Pending','2025-12-12 11:45:49.031397',3,1,'QUO-PRM-000001',0,1);
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pre_job_rfqitem`
--

LOCK TABLES `pre_job_rfqitem` WRITE;
/*!40000 ALTER TABLE `pre_job_rfqitem` DISABLE KEYS */;
INSERT INTO `pre_job_rfqitem` VALUES (1,4,150.00,1,1,1);
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_teammember`
--

LOCK TABLES `team_teammember` WRITE;
/*!40000 ALTER TABLE `team_teammember` DISABLE KEYS */;
INSERT INTO `team_teammember` VALUES (1,'Narayanan','Sales','allseasonholding@gmail.com','2025-12-12 11:43:36.845586'),(2,'Faasil','Sales','sales@primearabiagroup.com','2025-12-12 11:44:04.815371'),(3,'Ajay','Test','marketbytesdevops@gmail.com','2025-12-12 11:44:19.281367');
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `unit_unit`
--

LOCK TABLES `unit_unit` WRITE;
/*!40000 ALTER TABLE `unit_unit` DISABLE KEYS */;
INSERT INTO `unit_unit` VALUES (1,'Pcs','2025-12-12 11:45:44.464234');
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

-- Dump completed on 2025-12-12 11:47:08
