<?php
require_once 'config.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$action = $_REQUEST['action'] ?? '';
$db = getDB();

switch ($action) {

    // ---- AUTH ----
    case 'login':
        $email = sanitize($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        $stmt = $db->prepare("SELECT id, name, email, password, role FROM users WHERE email = ? AND is_active = 1");
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();
        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['name'];
            $_SESSION['role'] = $user['role'];
            echo json_encode(['success' => true, 'role' => $user['role'], 'name' => $user['name']]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
        }
        break;

    case 'register':
        $name     = sanitize($_POST['name'] ?? '');
        $email    = sanitize($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        $role     = in_array($_POST['role'] ?? '', ['seeker','employer']) ? $_POST['role'] : 'seeker';
        $phone    = sanitize($_POST['phone'] ?? '');

        if (!$name || !$email || !$password) {
            echo json_encode(['success' => false, 'message' => 'All fields required']); break;
        }
        $check = $db->prepare("SELECT id FROM users WHERE email = ?");
        $check->bind_param('s', $email);
        $check->execute();
        if ($check->get_result()->num_rows > 0) {
            echo json_encode(['success' => false, 'message' => 'Email already registered']); break;
        }
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $db->prepare("INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param('sssss', $name, $email, $hash, $role, $phone);
        if ($stmt->execute()) {
            $_SESSION['user_id'] = $db->insert_id;
            $_SESSION['user_name'] = $name;
            $_SESSION['role'] = $role;
            echo json_encode(['success' => true, 'role' => $role]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Registration failed']);
        }
        break;

    case 'logout':
        session_destroy();
        echo json_encode(['success' => true]);
        break;

    case 'check_session':
        if (isLoggedIn()) {
            echo json_encode(['loggedIn' => true, 'role' => $_SESSION['role'], 'name' => $_SESSION['user_name']]);
        } else {
            echo json_encode(['loggedIn' => false]);
        }
        break;

    // ---- JOBS ----
    case 'get_jobs':
        $search   = '%' . sanitize($_GET['search'] ?? '') . '%';
        $location = '%' . sanitize($_GET['location'] ?? '') . '%';
        $category = intval($_GET['category'] ?? 0);
        $job_type = sanitize($_GET['job_type'] ?? '');
        $work_mode = sanitize($_GET['work_mode'] ?? '');
        $exp      = sanitize($_GET['experience'] ?? '');
        $limit    = intval($_GET['limit'] ?? 9);
        $offset   = intval($_GET['offset'] ?? 0);

        $where = "WHERE j.status = 'active'";
        $params = [];
        $types  = '';

        if ($_GET['search'] ?? '') { $where .= " AND (j.title LIKE ? OR j.skills_required LIKE ?)"; $types .= 'ss'; $params[] = $search; $params[] = $search; }
        if ($_GET['location'] ?? '') { $where .= " AND j.location LIKE ?"; $types .= 's'; $params[] = $location; }
        if ($category) { $where .= " AND j.category_id = ?"; $types .= 'i'; $params[] = $category; }
        if ($job_type) { $where .= " AND j.job_type = ?"; $types .= 's'; $params[] = $job_type; }
        if ($work_mode) { $where .= " AND j.work_mode = ?"; $types .= 's'; $params[] = $work_mode; }
        if ($exp) { $where .= " AND j.experience_level = ?"; $types .= 's'; $params[] = $exp; }

        $sql = "SELECT j.*, c.company_name, c.logo, cat.name as category_name,
                       u.name as employer_name
                FROM jobs j
                LEFT JOIN companies c ON j.company_id = c.id
                LEFT JOIN categories cat ON j.category_id = cat.id
                LEFT JOIN users u ON j.employer_id = u.id
                $where ORDER BY j.is_featured DESC, j.created_at DESC LIMIT ? OFFSET ?";
        
        $types .= 'ii'; $params[] = $limit; $params[] = $offset;
        $stmt = $db->prepare($sql);
        if ($types) $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $jobs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        // Count
        $countSql = "SELECT COUNT(*) as total FROM jobs j $where";
        $cStmt = $db->prepare($countSql);
        $cTypes = str_replace('ii', '', $types);
        $cParams = array_slice($params, 0, -2);
        if ($cTypes) $cStmt->bind_param($cTypes, ...$cParams);
        $cStmt->execute();
        $total = $cStmt->get_result()->fetch_assoc()['total'];

        foreach ($jobs as &$job) {
            $job['salary_formatted'] = formatSalary($job['salary_min'], $job['salary_max'], $job['salary_type']);
            $job['posted_ago'] = timeAgo($job['created_at']);
        }
        echo json_encode(['success' => true, 'jobs' => $jobs, 'total' => $total]);
        break;

    case 'get_job_detail':
        $id = intval($_GET['id']);
        $db->query("UPDATE jobs SET views = views + 1 WHERE id = $id");
        $stmt = $db->prepare("SELECT j.*, c.company_name, c.logo, c.description as company_desc, c.website, c.industry, c.city, cat.name as category_name FROM jobs j LEFT JOIN companies c ON j.company_id = c.id LEFT JOIN categories cat ON j.category_id = cat.id WHERE j.id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $job = $stmt->get_result()->fetch_assoc();
        if ($job) {
            $job['salary_formatted'] = formatSalary($job['salary_min'], $job['salary_max'], $job['salary_type']);
            $job['posted_ago'] = timeAgo($job['created_at']);
            echo json_encode(['success' => true, 'job' => $job]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Job not found']);
        }
        break;

    case 'get_featured_jobs':
        $stmt = $db->prepare("SELECT j.*, c.company_name, c.logo FROM jobs j LEFT JOIN companies c ON j.company_id = c.id WHERE j.is_featured = 1 AND j.status = 'active' LIMIT 6");
        $stmt->execute();
        $jobs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        foreach ($jobs as &$j) { $j['salary_formatted'] = formatSalary($j['salary_min'], $j['salary_max'], $j['salary_type']); $j['posted_ago'] = timeAgo($j['created_at']); }
        echo json_encode(['success' => true, 'jobs' => $jobs]);
        break;

    case 'get_categories':
        $stmt = $db->prepare("SELECT c.*, COUNT(j.id) as job_count FROM categories c LEFT JOIN jobs j ON c.id = j.category_id AND j.status='active' GROUP BY c.id ORDER BY job_count DESC");
        $stmt->execute();
        echo json_encode(['success' => true, 'categories' => $stmt->get_result()->fetch_all(MYSQLI_ASSOC)]);
        break;

    case 'get_stats':
        $jobs_count   = $db->query("SELECT COUNT(*) as c FROM jobs WHERE status='active'")->fetch_assoc()['c'];
        $company_count = $db->query("SELECT COUNT(*) as c FROM companies")->fetch_assoc()['c'];
        $seeker_count = $db->query("SELECT COUNT(*) as c FROM users WHERE role='seeker'")->fetch_assoc()['c'];
        $placed_count = $db->query("SELECT COUNT(*) as c FROM applications WHERE status='hired'")->fetch_assoc()['c'];
        echo json_encode(['success' => true, 'stats' => ['jobs' => $jobs_count, 'companies' => $company_count, 'seekers' => $seeker_count, 'placed' => $placed_count]]);
        break;

    // ---- APPLY ----
    case 'apply_job':
        if (!isLoggedIn()) { echo json_encode(['success' => false, 'message' => 'Please login first']); break; }
        $job_id = intval($_POST['job_id']);
        $cover  = sanitize($_POST['cover_letter'] ?? '');
        $seeker_id = $_SESSION['user_id'];
        $stmt = $db->prepare("INSERT INTO applications (job_id, seeker_id, cover_letter) VALUES (?, ?, ?)");
        $stmt->bind_param('iis', $job_id, $seeker_id, $cover);
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Application submitted successfully!']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Already applied or an error occurred']);
        }
        break;

    case 'save_job':
        if (!isLoggedIn()) { echo json_encode(['success' => false, 'message' => 'Please login']); break; }
        $job_id = intval($_POST['job_id']);
        $user_id = $_SESSION['user_id'];
        $check = $db->prepare("SELECT id FROM saved_jobs WHERE user_id = ? AND job_id = ?");
        $check->bind_param('ii', $user_id, $job_id);
        $check->execute();
        if ($check->get_result()->num_rows > 0) {
            $db->prepare("DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?")->execute() || $db->query("DELETE FROM saved_jobs WHERE user_id=$user_id AND job_id=$job_id");
            echo json_encode(['success' => true, 'saved' => false, 'message' => 'Job unsaved']);
        } else {
            $stmt = $db->prepare("INSERT INTO saved_jobs (user_id, job_id) VALUES (?, ?)");
            $stmt->bind_param('ii', $user_id, $job_id);
            $stmt->execute();
            echo json_encode(['success' => true, 'saved' => true, 'message' => 'Job saved!']);
        }
        break;

    // ---- CONTACT ----
    case 'contact':
        $name    = sanitize($_POST['name'] ?? '');
        $email   = sanitize($_POST['email'] ?? '');
        $subject = sanitize($_POST['subject'] ?? '');
        $message = sanitize($_POST['message'] ?? '');
        if (!$name || !$email || !$message) { echo json_encode(['success' => false, 'message' => 'All fields required']); break; }
        $stmt = $db->prepare("INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)");
        $stmt->bind_param('ssss', $name, $email, $subject, $message);
        echo json_encode(['success' => $stmt->execute(), 'message' => 'Message sent successfully!']);
        break;

    // ---- POST JOB ----
    case 'post_job':
        if (!isLoggedIn() || !isEmployer()) { echo json_encode(['success' => false, 'message' => 'Unauthorized']); break; }
        $employer_id = $_SESSION['user_id'];
        $comp = $db->query("SELECT id FROM companies WHERE user_id = $employer_id")->fetch_assoc();
        $company_id = $comp ? $comp['id'] : null;

        $title    = sanitize($_POST['title']);
        $desc     = sanitize($_POST['description']);
        $req      = sanitize($_POST['requirements'] ?? '');
        $type     = sanitize($_POST['job_type']);
        $mode     = sanitize($_POST['work_mode']);
        $loc      = sanitize($_POST['location']);
        $sal_min  = floatval($_POST['salary_min'] ?? 0);
        $sal_max  = floatval($_POST['salary_max'] ?? 0);
        $exp      = sanitize($_POST['experience_level']);
        $skills   = sanitize($_POST['skills_required'] ?? '');
        $vacancies= intval($_POST['vacancies'] ?? 1);
        $deadline = sanitize($_POST['deadline'] ?? '');
        $cat_id   = intval($_POST['category_id'] ?? 0);

        $stmt = $db->prepare("INSERT INTO jobs (employer_id, company_id, category_id, title, description, requirements, job_type, work_mode, location, salary_min, salary_max, experience_level, skills_required, vacancies, deadline) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
        $stmt->bind_param('iiissssssddssis', $employer_id, $company_id, $cat_id, $title, $desc, $req, $type, $mode, $loc, $sal_min, $sal_max, $exp, $skills, $vacancies, $deadline);
        echo json_encode(['success' => $stmt->execute(), 'message' => 'Job posted successfully!']);
        break;

    // ---- DASHBOARD DATA ----
    case 'dashboard_stats':
        if (!isLoggedIn()) { echo json_encode(['success' => false]); break; }
        $uid = $_SESSION['user_id'];
        if ($_SESSION['role'] === 'admin') {
            $data = [
                'total_jobs'      => $db->query("SELECT COUNT(*) as c FROM jobs")->fetch_assoc()['c'],
                'total_users'     => $db->query("SELECT COUNT(*) as c FROM users")->fetch_assoc()['c'],
                'total_apps'      => $db->query("SELECT COUNT(*) as c FROM applications")->fetch_assoc()['c'],
                'total_companies' => $db->query("SELECT COUNT(*) as c FROM companies")->fetch_assoc()['c'],
                'recent_jobs'     => $db->query("SELECT j.title, j.status, j.created_at, c.company_name FROM jobs j LEFT JOIN companies c ON j.company_id=c.id ORDER BY j.created_at DESC LIMIT 5")->fetch_all(MYSQLI_ASSOC),
                'recent_apps'     => $db->query("SELECT a.*, u.name as seeker_name, jo.title as job_title FROM applications a JOIN users u ON a.seeker_id=u.id JOIN jobs jo ON a.job_id=jo.id ORDER BY a.applied_at DESC LIMIT 5")->fetch_all(MYSQLI_ASSOC),
            ];
        } elseif ($_SESSION['role'] === 'employer') {
            $data = [
                'my_jobs'     => $db->query("SELECT COUNT(*) as c FROM jobs WHERE employer_id=$uid")->fetch_assoc()['c'],
                'total_apps'  => $db->query("SELECT COUNT(*) as c FROM applications a JOIN jobs j ON a.job_id=j.id WHERE j.employer_id=$uid")->fetch_assoc()['c'],
                'active_jobs' => $db->query("SELECT COUNT(*) as c FROM jobs WHERE employer_id=$uid AND status='active'")->fetch_assoc()['c'],
                'recent_apps' => $db->query("SELECT a.*, u.name as seeker_name, jo.title as job_title FROM applications a JOIN users u ON a.seeker_id=u.id JOIN jobs jo ON a.job_id=jo.id WHERE jo.employer_id=$uid ORDER BY a.applied_at DESC LIMIT 5")->fetch_all(MYSQLI_ASSOC),
                'my_job_list' => $db->query("SELECT j.*, COUNT(a.id) as app_count FROM jobs j LEFT JOIN applications a ON j.id=a.job_id WHERE j.employer_id=$uid GROUP BY j.id ORDER BY j.created_at DESC LIMIT 5")->fetch_all(MYSQLI_ASSOC),
            ];
        } else {
            $data = [
                'applied'  => $db->query("SELECT COUNT(*) as c FROM applications WHERE seeker_id=$uid")->fetch_assoc()['c'],
                'saved'    => $db->query("SELECT COUNT(*) as c FROM saved_jobs WHERE user_id=$uid")->fetch_assoc()['c'],
                'hired'    => $db->query("SELECT COUNT(*) as c FROM applications WHERE seeker_id=$uid AND status='hired'")->fetch_assoc()['c'],
                'my_apps'  => $db->query("SELECT a.*, jo.title, c.company_name FROM applications a JOIN jobs jo ON a.job_id=jo.id LEFT JOIN companies c ON jo.company_id=c.id WHERE a.seeker_id=$uid ORDER BY a.applied_at DESC LIMIT 5")->fetch_all(MYSQLI_ASSOC),
            ];
        }
        echo json_encode(['success' => true, 'data' => $data]);
        break;

    case 'update_app_status':
        if (!isLoggedIn()) { echo json_encode(['success'=>false]); break; }
        $app_id = intval($_POST['app_id']);
        $status = sanitize($_POST['status']);
        $db->query("UPDATE applications SET status='$status' WHERE id=$app_id");
        echo json_encode(['success'=>true]);
        break;

    case 'toggle_job_status':
        if (!isLoggedIn()) { echo json_encode(['success'=>false]); break; }
        $job_id = intval($_POST['job_id']);
        $status = sanitize($_POST['status']);
        $db->query("UPDATE jobs SET status='$status' WHERE id=$job_id");
        echo json_encode(['success'=>true]);
        break;

    default:
        echo json_encode(['error' => 'Invalid action']);
}

$db->close();
?>
