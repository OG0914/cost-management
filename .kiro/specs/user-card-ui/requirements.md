# Requirements Document

## Introduction

将用户管理模块从传统表格样式改造为现代化卡片样式，提供更直观的用户信息展示和更好的视觉体验。同时保留列表视图，支持卡片/列表视图切换。

## Glossary

- **User_Management_System**: 用户管理系统，负责用户的增删改查和权限管理
- **Card_View**: 卡片视图，以卡片形式展示用户信息
- **List_View**: 列表视图，以表格形式展示用户信息
- **Avatar**: 用户头像，显示用户姓名首字母
- **Role_Badge**: 角色徽章，用彩色标签展示用户角色
- **Status_Indicator**: 状态指示器，显示用户启用/禁用状态

## Requirements

### Requirement 1

**User Story:** As an administrator, I want to view users in a card layout, so that I can quickly identify user information visually.

#### Acceptance Criteria

1. WHEN the administrator opens the user management page THEN the User_Management_System SHALL display users in Card_View by default
2. WHEN displaying a user card THEN the User_Management_System SHALL show Avatar and username side by side horizontally
3. WHEN displaying a user card THEN the User_Management_System SHALL show real_name below the username vertically
4. WHEN displaying a user card THEN the User_Management_System SHALL show Role_Badge with role-specific color
5. WHEN displaying a user card THEN the User_Management_System SHALL show email address
6. WHEN displaying a user card THEN the User_Management_System SHALL show Status_Indicator (green dot for enabled, gray dot for disabled)

### Requirement 2

**User Story:** As an administrator, I want to switch between card and list views, so that I can choose the most suitable display format.

#### Acceptance Criteria

1. WHEN the administrator clicks the grid icon THEN the User_Management_System SHALL switch to Card_View
2. WHEN the administrator clicks the list icon THEN the User_Management_System SHALL switch to List_View
3. WHEN in List_View THEN the User_Management_System SHALL display users in a table format with columns for username, real_name, role, email, status, and actions
4. WHEN switching views THEN the User_Management_System SHALL preserve the current filter and search state

### Requirement 3

**User Story:** As an administrator, I want to perform user operations from the card, so that I can manage users efficiently.

#### Acceptance Criteria

1. WHEN the administrator clicks the Key icon on a user card THEN the User_Management_System SHALL open the reset password dialog
2. WHEN the administrator clicks the EditPen icon on a user card THEN the User_Management_System SHALL open the edit user dialog
3. WHEN the administrator clicks the Delete icon on a user card THEN the User_Management_System SHALL show a confirmation dialog before deletion
4. IF the user is the admin account THEN the User_Management_System SHALL disable the delete button

### Requirement 4

**User Story:** As an administrator, I want to filter and search users, so that I can find specific users quickly.

#### Acceptance Criteria

1. WHEN the administrator types in the search box THEN the User_Management_System SHALL filter users by username or real_name
2. WHEN the administrator selects a role filter THEN the User_Management_System SHALL display only users with the selected role
3. WHEN the administrator selects a status filter THEN the User_Management_System SHALL display only users with the selected status

### Requirement 5

**User Story:** As an administrator, I want the card layout to be responsive, so that it displays properly on different screen sizes.

#### Acceptance Criteria

1. WHEN the screen width is 1200px or more THEN the User_Management_System SHALL display 4 cards per row
2. WHEN the screen width is between 992px and 1199px THEN the User_Management_System SHALL display 3 cards per row
3. WHEN the screen width is between 768px and 991px THEN the User_Management_System SHALL display 2 cards per row
4. WHEN the screen width is less than 768px THEN the User_Management_System SHALL display 1 card per row

### Requirement 6

**User Story:** As an administrator, I want role badges to have distinct colors, so that I can quickly identify user roles.

#### Acceptance Criteria

1. WHEN displaying admin role THEN the User_Management_System SHALL show Role_Badge in red color (#F56C6C)
2. WHEN displaying purchaser role THEN the User_Management_System SHALL show Role_Badge in orange color (#E6A23C)
3. WHEN displaying producer role THEN the User_Management_System SHALL show Role_Badge in green color (#67C23A)
4. WHEN displaying reviewer role THEN the User_Management_System SHALL show Role_Badge in blue color (#409EFF)
5. WHEN displaying salesperson role THEN the User_Management_System SHALL show Role_Badge in purple color (#9B59B6)
6. WHEN displaying readonly role THEN the User_Management_System SHALL show Role_Badge in gray color (#909399)
