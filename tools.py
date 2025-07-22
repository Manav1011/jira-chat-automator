from google.genai import types
tools = [
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="jira_get_user_profile",
                description="Retrieve profile information for a specific Jira user.\n\n    Args:\n        ctx: The FastMCP context.\n        user_identifier: User identifier (email, username, key, or account ID).\n\n    Returns:\n        JSON string representing the Jira user profile object, or an error object if not found.\n\n    Raises:\n        ValueError: If the Jira client is not configured or available.\n    ",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    required=["user_identifier"],
                    properties={
                        "user_identifier": types.Schema(
                            type=types.Type.STRING,
                        ),
                    },
                ),
            ),
        ],
    ),
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="jira_get_issue",
                description="Get details of a specific Jira issue including its Epic links and relationship information.\n\n    Args:\n        ctx: The FastMCP context.\n        issue_key: Jira issue key.\n        fields: Comma-separated list of fields to return (e.g., 'summary,status,customfield_10010'), a single field as a string (e.g., 'duedate'), '*all' for all fields, or omitted for essentials.\n        expand: Optional fields to expand.\n        comment_limit: Maximum number of comments.\n        properties: Issue properties to return.\n        update_history: Whether to update issue view history.\n\n    Returns:\n        JSON string representing the Jira issue object.\n\n    Raises:\n        ValueError: If the Jira client is not configured or available.\n    ",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    required=["issue_key"],
                    properties={
                        "issue_key": types.Schema(type=types.Type.STRING),
                        "fields": types.Schema(type=types.Type.STRING),
                        "expand": types.Schema(type=types.Type.STRING),
                        "comment_limit": types.Schema(type=types.Type.INTEGER),
                        "properties": types.Schema(type=types.Type.STRING),
                        "update_history": types.Schema(type=types.Type.BOOLEAN),
                    },
                ),
            ),
        ],
    ),
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="jira_search",
                description="Search Jira issues using JQL (Jira Query Language).\n\n    Args:\n        ctx: The FastMCP context.\n        jql: JQL query string.\n        fields: Comma-separated fields to return.\n        limit: Maximum number of results.\n        start_at: Starting index for pagination.\n        projects_filter: Comma-separated list of project keys to filter by.\n        expand: Optional fields to expand.\n\n    Example JQL formats:\n        - Find all issues in a project: project = PROJ\n        - Find issues assigned to a user: assignee = currentUser()\n        - Find issues by status: status = 'In Progress'\n        - Find issues updated recently: updated >= -7d\n        - Find issues with a label: labels = frontend\n        - Find issues by priority: priority = High\n        - Find Epics: issuetype = Epic AND project = PROJ\n        - Find issues in Epic: parent = PROJ-123\n        - Find by summary text: summary ~ 'login bug'\n\n    Returns:\n        JSON string representing the search results including pagination info.\n    ",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    required=["jql"],
                    properties={
                        "jql": types.Schema(type=types.Type.STRING),
                        "fields": types.Schema(type=types.Type.STRING),
                        "limit": types.Schema(type=types.Type.INTEGER),
                        "start_at": types.Schema(type=types.Type.INTEGER),
                        "projects_filter": types.Schema(type=types.Type.STRING),
                        "expand": types.Schema(type=types.Type.STRING),
                    },
                ),
            ),
        ],
    ),
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="jira_search_fields",
                description="Search Jira fields by keyword with fuzzy match.\n\n    Args:\n        ctx: The FastMCP context.\n        keyword: Keyword for fuzzy search.\n        limit: Maximum number of results.\n        refresh: Whether to force refresh the field list.\n\n    Returns:\n        JSON string representing a list of matching field definitions.\n    ",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "keyword": types.Schema(type=types.Type.STRING),
                        "limit": types.Schema(type=types.Type.INTEGER),
                        "refresh": types.Schema(type=types.Type.BOOLEAN),
                    },
                ),
            ),
        ],
    ),
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="jira_get_project_issues",
                description="Get all issues for a specific Jira project.\n\n    Args:\n        ctx: The FastMCP context.\n        project_key: The project key.\n        limit: Maximum number of results.\n        start_at: Starting index for pagination.\n\n    Returns:\n        JSON string representing the search results including pagination info.\n    ",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    required=["project_key"],
                    properties={
                        "project_key": types.Schema(type=types.Type.STRING),
                        "limit": types.Schema(type=types.Type.INTEGER),
                        "start_at": types.Schema(type=types.Type.INTEGER),
                    },
                ),
            ),
        ],
    ),
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="jira_get_transitions",
                description="Get available status transitions for a Jira issue.\n\n    Args:\n        ctx: The FastMCP context.\n        issue_key: Jira issue key.\n\n    Returns:\n        JSON string representing a list of available transitions.\n    ",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    required=["issue_key"],
                    properties={
                        "issue_key": types.Schema(type=types.Type.STRING),
                    },
                ),
            ),
        ],
    ),
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="jira_get_worklog",
                description="Get worklog entries for a Jira issue.\n\n    Args:\n        ctx: The FastMCP context.\n        issue_key: Jira issue key.\n\n    Returns:\n        JSON string representing the worklog entries.\n    ",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    required=["issue_key"],
                    properties={
                        "issue_key": types.Schema(type=types.Type.STRING),
                    },
                ),
            ),
        ],
    ),
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="jira_download_attachments",
                description="Download attachments from a Jira issue.\n\n    Args:\n        ctx: The FastMCP context.\n        issue_key: Jira issue key.\n        target_dir: Directory to save attachments.\n\n    Returns:\n        JSON string indicating the result of the download operation.\n    ",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    required=["issue_key", "target_dir"],
                    properties={
                        "issue_key": types.Schema(type=types.Type.STRING),
                        "target_dir": types.Schema(type=types.Type.STRING),
                    },
                ),
            ),
        ],
    ),
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="jira_get_agile_boards",
                description="Get jira agile boards by name, project key, or type.\n\n    Args:\n        ctx: The FastMCP context.\n        board_name: Name of the board (fuzzy search).\n        project_key: Project key.\n        board_type: Board type ('scrum' or 'kanban').\n        start_at: Starting index.\n        limit: Maximum results.\n\n    Returns:\n        JSON string representing a list of board objects.\n    ",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "board_name": types.Schema(type=types.Type.STRING),
                        "project_key": types.Schema(type=types.Type.STRING),
                        "board_type": types.Schema(type=types.Type.STRING),
                        "start_at": types.Schema(type=types.Type.INTEGER),
                        "limit": types.Schema(type=types.Type.INTEGER),
                    },
                ),
            ),
        ],
    ),
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="jira_get_board_issues",
                description="Get all issues linked to a specific board filtered by JQL.\n\n    Args:\n        ctx: The FastMCP context.\n        board_id: The ID of the board.\n        jql: JQL query string to filter issues.\n        fields: Comma-separated fields to return.\n        start_at: Starting index for pagination.\n        limit: Maximum number of results.\n        expand: Optional fields to expand.\n\n    Example JQL formats:\n        - Find all issues in a project: project = PROJ\n        - Find issues assigned to a user: assignee = currentUser()\n        - Find issues by status: status = 'In Progress'\n        - Find issues updated recently: updated >= -7d\n        - Find issues with a label: labels = frontend\n        - Find issues by priority: priority = High\n        - Find Epics: issuetype = Epic AND project = PROJ\n        - Find issues in Epic: parent = PROJ-123\n        - Find by summary text: summary ~ 'login bug'\n\n    Returns:\n        JSON string representing the search results including pagination info.\n    ",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    required=["board_id", "jql"],
                    properties={
                        "board_id": types.Schema(type=types.Type.STRING),
                        "jql": types.Schema(type=types.Type.STRING),
                        "fields": types.Schema(type=types.Type.STRING),
                        "start_at": types.Schema(type=types.Type.INTEGER),
                        "limit": types.Schema(type=types.Type.INTEGER),
                        "expand": types.Schema(type=types.Type.STRING),
                    },
                ),
            ),
        ],
    ),
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="jira_get_sprints_from_board",
                description="Get jira sprints from board by state.\n\n    Args:\n        ctx: The FastMCP context.\n        board_id: The ID of the board.\n        state: Sprint state ('active', 'future', 'closed'). If None, returns all sprints.\n        start_at: Starting index.\n        limit: Maximum results.\n\n    Returns:\n        JSON string representing a list of sprint objects.\n    ",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    required=["board_id"],
                    properties={
                        "board_id": types.Schema(type=types.Type.STRING),
                        "state": types.Schema(type=types.Type.STRING),
                        "start_at": types.Schema(type=types.Type.INTEGER),
                        "limit": types.Schema(type=types.Type.INTEGER),
                    },
                ),
            ),
        ],
    ),
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="jira_get_sprint_issues",
                description="Get jira issues from sprint.\n\n    Args:\n        ctx: The FastMCP context.\n        sprint_id: The ID of the sprint.\n        fields: Comma-separated fields to return.\n        start_at: Starting index.\n        limit: Maximum results.\n\n    Example JQL formats:\n        - Find all issues in a project: project = PROJ\n        - Find issues assigned to a user: assignee = currentUser()\n        - Find issues by status: status = 'In Progress'\n        - Find issues updated recently: updated >= -7d\n        - Find issues with a label: labels = frontend\n        - Find issues by priority: priority = High\n        - Find Epics: issuetype = Epic AND project = PROJ\n        - Find issues in Epic: parent = PROJ-123\n        - Find by summary text: summary ~ 'login bug'\n\n    Returns:\n        JSON string representing the search results including pagination info.\n    ",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    required=["sprint_id"],
                    properties={
                        "sprint_id": types.Schema(type=types.Type.STRING),
                        "fields": types.Schema(type=types.Type.STRING),
                        "start_at": types.Schema(type=types.Type.INTEGER),
                        "limit": types.Schema(type=types.Type.INTEGER),
                    },
                ),
            ),
        ],
    ),
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="jira_get_link_types",
                description="Get all available issue link types.\n\n    Args:\n        ctx: The FastMCP context.\n\n    Returns:\n        JSON string representing a list of issue link type objects.\n    ",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={},
                ),
            ),
        ],
    ),
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="jira_create_issue",
                description="Create a new Jira issue with optional Epic link or parent for subtasks.\n\n    Args:\n        ctx: The FastMCP context.\n        project_key: The JIRA project key.\n        summary: Summary/title of the issue.\n        issue_type: Issue type (e.g., 'Task', 'Bug', 'Story', 'Epic', 'Subtask').\n        assignee: Assignee's user identifier (string): Email, display name, or account ID (e.g., 'user@example.com', 'John Doe', 'accountid:...').\n        description: Issue description.\n        components: Comma-separated list of component names.\n        additional_fields: Dictionary of additional fields.\n\n    Returns:\n        JSON string representing the created issue object.\n\n    Raises:\n        ValueError: If in read-only mode or Jira client is unavailable.\n    ",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    required=["project_key", "summary", "issue_type"],
                    properties={
                        "project_key": types.Schema(type=types.Type.STRING),
                        "summary": types.Schema(type=types.Type.STRING),
                        "issue_type": types.Schema(type=types.Type.STRING),
                        "assignee": types.Schema(type=types.Type.STRING),
                        "description": types.Schema(type=types.Type.STRING),
                        "components": types.Schema(type=types.Type.STRING),
                        "additional_fields": types.Schema(type=types.Type.OBJECT),
                    },
                ),
            ),
        ],
    ),
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="jira_batch_create_issues",
                description="Create multiple Jira issues in a batch.\n\n    Args:\n        ctx: The FastMCP context.\n        issues: JSON array string of issue objects.\n        validate_only: If true, only validates without creating.\n\n    Returns:\n        JSON string indicating success and listing created issues (or validation result).\n\n    Raises:\n        ValueError: If in read-only mode, Jira client unavailable, or invalid JSON.\n    ",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    required=["issues"],
                    properties={
                        "issues": types.Schema(type=types.Type.STRING),
                        "validate_only": types.Schema(type=types.Type.BOOLEAN),
                    },
                ),
            ),
        ],
    ),
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="jira_batch_get_changelogs",
                description="Get changelogs for multiple Jira issues (Cloud only).\n\n    Args:\n        ctx: The FastMCP context.\n        issue_ids_or_keys: List of issue IDs or keys.\n        fields: List of fields to filter changelogs by. None for all fields.\n        limit: Maximum changelogs per issue (-1 for all).\n\n    Returns:\n        JSON string representing a list of issues with their changelogs.\n\n    Raises:\n        NotImplementedError: If run on Jira Server/Data Center.\n        ValueError: If Jira client is unavailable.\n    ",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    required=["issue_ids_or_keys"],
                    properties={
                        "issue_ids_or_keys": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
                        "fields": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
                        "limit": types.Schema(type=types.Type.INTEGER),
                    },
                ),
            ),
        ],
    ),
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="jira_update_issue",
                description="Update an existing Jira issue including changing status, adding Epic links, updating fields, etc.\n\n    Args:\n        ctx: The FastMCP context.\n        issue_key: Jira issue key.\n        fields: Dictionary of fields to update.\n        additional_fields: Optional dictionary of additional fields.\n        attachments: Optional JSON array string or comma-separated list of file paths.\n\n    Returns:\n        JSON string representing the updated issue object and attachment results.\n\n    Raises:\n        ValueError: If in read-only mode or Jira client unavailable, or invalid input.\n    ",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    required=["issue_key", "fields"],
                    properties={
                        "issue_key": types.Schema(type=types.Type.STRING),
                        "fields": types.Schema(type=types.Type.OBJECT),
                        "additional_fields": types.Schema(type=types.Type.OBJECT),
                        "attachments": types.Schema(type=types.Type.STRING),
                    },
                ),
            ),
        ],
    ),
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="jira_delete_issue",
                description="Delete an existing Jira issue.\n\n    Args:\n        ctx: The FastMCP context.\n        issue_key: Jira issue key.\n\n    Returns:\n        JSON string indicating success.\n\n    Raises:\n        ValueError: If in read-only mode or Jira client unavailable.\n    ",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    required=["issue_key"],
                    properties={
                        "issue_key": types.Schema(type=types.Type.STRING),
                    },
                ),
            ),
        ],
    ),
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="jira_add_comment",
                description="Add a comment to a Jira issue.\n\n    Args:\n        ctx: The FastMCP context.\n        issue_key: Jira issue key.\n        comment: Comment text in Markdown.\n\n    Returns:\n        JSON string representing the added comment object.\n\n    Raises:\n        ValueError: If in read-only mode or Jira client unavailable.\n    ",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    required=["issue_key", "comment"],
                    properties={
                        "issue_key": types.Schema(type=types.Type.STRING),
                        "comment": types.Schema(type=types.Type.STRING),
                    },
                ),
            ),
        ],
    ),
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="jira_add_worklog",
                description="Add a worklog entry to a Jira issue.\n\n    Args:\n        ctx: The FastMCP context.\n        issue_key: Jira issue key.\n        time_spent: Time spent in Jira format.\n        comment: Optional comment in Markdown.\n        started: Optional start time in ISO format.\n        original_estimate: Optional new original estimate.\n        remaining_estimate: Optional new remaining estimate.\n\n\n    Returns:\n        JSON string representing the added worklog object.\n\n    Raises:\n        ValueError: If in read-only mode or Jira client unavailable.\n    ",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    required=["issue_key", "time_spent"],
                    properties={
                        "issue_key": types.Schema(type=types.Type.STRING),
                        "time_spent": types.Schema(type=types.Type.STRING),
                        "comment": types.Schema(type=types.Type.STRING),
                        "started": types.Schema(type=types.Type.STRING),
                        "original_estimate": types.Schema(type=types.Type.STRING),
                        "remaining_estimate": types.Schema(type=types.Type.STRING),
                    },
                ),
            ),
        ],
    ),
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="jira_link_to_epic",
                description="Link an existing issue to an epic.\n\n    Args:\n        ctx: The FastMCP context.\n        issue_key: The key of the issue to link.\n        epic_key: The key of the epic to link to.\n\n    Returns:\n        JSON string representing the updated issue object.\n\n    Raises:\n        ValueError: If in read-only mode or Jira client unavailable.\n    ",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    required=["issue_key", "epic_key"],
                    properties={
                        "issue_key": types.Schema(type=types.Type.STRING),
                        "epic_key": types.Schema(type=types.Type.STRING),
                    },
                ),
            ),
        ],
    ),
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="jira_create_issue_link",
                description="Create a link between two Jira issues.\n\n    Args:\n        ctx: The FastMCP context.\n        link_type: The type of link (e.g., 'Blocks').\n        inward_issue_key: The key of the source issue.\n        outward_issue_key: The key of the target issue.\n        comment: Optional comment text.\n        comment_visibility: Optional dictionary for comment visibility.\n\n    Returns:\n        JSON string indicating success or failure.\n\n    Raises:\n        ValueError: If required fields are missing, invalid input, in read-only mode, or Jira client unavailable.\n    ",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    required=["link_type", "inward_issue_key", "outward_issue_key"],
                    properties={
                        "link_type": types.Schema(type=types.Type.STRING),
                        "inward_issue_key": types.Schema(type=types.Type.STRING),
                        "outward_issue_key": types.Schema(type=types.Type.STRING),
                        "comment": types.Schema(type=types.Type.STRING),
                        "comment_visibility": types.Schema(type=types.Type.OBJECT),
                    },
                ),
            ),
        ],
    ),
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="jira_create_remote_issue_link",
                description="Create a remote issue link (web link or Confluence link) for a Jira issue.\n\n    This tool allows you to add web links and Confluence links to Jira issues.\n    The links will appear in the issue's \"Links\" section and can be clicked to navigate to external resources.\n\n    Args:\n        ctx: The FastMCP context.\n        issue_key: The key of the issue to add the link to.\n        url: The URL to link to (can be any web page or Confluence page).\n        title: The title/name that will be displayed for the link.\n        summary: Optional description of what the link is for.\n        relationship: Optional relationship description.\n        icon_url: Optional URL to a 16x16 icon for the link.\n\n    Returns:\n        JSON string indicating success or failure.\n\n    Raises:\n        ValueError: If required fields are missing, invalid input, in read-only mode, or Jira client unavailable.\n    ",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    required=["issue_key", "url", "title"],
                    properties={
                        "issue_key": types.Schema(type=types.Type.STRING),
                        "url": types.Schema(type=types.Type.STRING),
                        "title": types.Schema(type=types.Type.STRING),
                        "summary": types.Schema(type=types.Type.STRING),
                        "relationship": types.Schema(type=types.Type.STRING),
                        "icon_url": types.Schema(type=types.Type.STRING),
                    },
                ),
            ),
        ],
    ),
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="jira_remove_issue_link",
                description="Remove a link between two Jira issues.\n\n    Args:\n        ctx: The FastMCP context.\n        link_id: The ID of the link to remove.\n\n    Returns:\n        JSON string indicating success.\n\n    Raises:\n        ValueError: If link_id is missing, in read-only mode, or Jira client unavailable.\n    ",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    required=["link_id"],
                    properties={
                        "link_id": types.Schema(type=types.Type.STRING),
                    },
                ),
            ),
        ],
    ),
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="jira_transition_issue",
                description="Transition a Jira issue to a new status.\n\n    Args:\n        ctx: The FastMCP context.\n        issue_key: Jira issue key.\n        transition_id: ID of the transition.\n        fields: Optional dictionary of fields to update during transition.\n        comment: Optional comment for the transition.\n\n    Returns:\n        JSON string representing the updated issue object.\n\n    Raises:\n        ValueError: If required fields missing, invalid input, in read-only mode, or Jira client unavailable.\n    ",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    required=["issue_key", "transition_id"],
                    properties={
                        "issue_key": types.Schema(type=types.Type.STRING),
                        "transition_id": types.Schema(type=types.Type.STRING),
                        "fields": types.Schema(type=types.Type.OBJECT),
                        "comment": types.Schema(type=types.Type.STRING),
                    },
                ),
            ),
        ],
    ),
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="jira_create_sprint",
                description="Create Jira sprint for a board.\n\n    Args:\n        ctx: The FastMCP context.\n        board_id: Board ID.\n        sprint_name: Sprint name.\n        start_date: Start date (ISO format).\n        end_date: End date (ISO format).\n        goal: Optional sprint goal.\n\n    Returns:\n        JSON string representing the created sprint object.\n\n    Raises:\n        ValueError: If in read-only mode or Jira client unavailable.\n    ",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    required=["board_id", "sprint_name", "start_date", "end_date"],
                    properties={
                        "board_id": types.Schema(type=types.Type.STRING),
                        "sprint_name": types.Schema(type=types.Type.STRING),
                        "start_date": types.Schema(type=types.Type.STRING),
                        "end_date": types.Schema(type=types.Type.STRING),
                        "goal": types.Schema(type=types.Type.STRING),
                    },
                ),
            ),
        ],
    ),
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="jira_update_sprint",
                description="Update jira sprint.\n\n    Args:\n        ctx: The FastMCP context.\n        sprint_id: The ID of the sprint.\n        sprint_name: Optional new name.\n        state: Optional new state (future|active|closed).\n        start_date: Optional new start date.\n        end_date: Optional new end date.\n        goal: Optional new goal.\n\n    Returns:\n        JSON string representing the updated sprint object or an error message.\n\n    Raises:\n        ValueError: If in read-only mode or Jira client unavailable.\n    ",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    required=["sprint_id"],
                    properties={
                        "sprint_id": types.Schema(type=types.Type.STRING),
                        "sprint_name": types.Schema(type=types.Type.STRING),
                        "state": types.Schema(type=types.Type.STRING),
                        "start_date": types.Schema(type=types.Type.STRING),
                        "end_date": types.Schema(type=types.Type.STRING),
                        "goal": types.Schema(type=types.Type.STRING),
                    },
                ),
            ),
        ],
    ),
]
