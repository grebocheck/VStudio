# Project workflow

The user has explicitly requested automatic commits and pushes. After completing and verifying requested changes, commit the task's changes and push the current branch without asking for confirmation again. Preserve unrelated work and do not rewrite published history without explicit authorization.

# Codebase discovery

Prefer codebase-memory-mcp graph tools for code discovery: search_graph, trace_path, get_code_snippet, query_graph and get_architecture. Index the repository if it is not indexed. Use source reads or rg for string literals, configuration, non-code files, or insufficient graph coverage.
