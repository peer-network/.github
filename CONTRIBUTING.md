# How to Contribute to a GitHub Repository  

This guide outlines the collaborative workflow for contributing to this repository. Follow these steps to ensure smooth collaboration and code integration.  

---

## 📛 Naming Conventions (Branches & Commits)  

### **Branch Names**  
Follow the format:  
`<username>/<type>/<short-description>`  

**Examples:**  
```bash  
git checkout -b jakob/feat/user-auth      # Feature branch  
git checkout -b lena/fix/header-overflow  # Bug fix branch  
git checkout -b max/docs/contributing     # Documentation update  
```  

**Accepted Types:**  
- `feat/`: New features or functionality.  
- `fix/`: Bug fixes or patches.  
- `docs/`: Documentation changes.  
- `chore/`: Maintenance tasks (e.g., CI/CD, dependency updates).  
- `test/`: Adding or updating tests.  
- `refactor/`: Code restructuring (no new features/fixes).  

**Rules:**  
- Always Branch from the **development** branch!  
- Only use lower case letters.  
- Try holding the Branchnames short and descriptiv.  
---

### **Commit Messages**  
`<type>(<scope>): <subject>`  

**Examples:**  
```bash  
git commit -m "feat(auth): add OAuth2 login support"  
git commit -m "fix(header): resolve mobile overflow"  
git commit -m "docs(readme): update contribution guide"  
```  

**Rules:**  
- Use the **imperative mood** ("add" instead of "added").  
- Try to keep the subject line under **50 characters**.  

---

## 🛠️ Getting Started  

### Internal Team: 1. Clone the Repository  
First, clone the repository to your local machine:  
```bash  
git clone https://github.com/peer-network/<repository_name>.git  
```  
### External Contributors: 1. Fork the Repository  
Create a fork of the Repository and then clone to you local machine:  
```bash  
git clone https://github.com/<your-github-username>/<repositor_name>.git  
```  

### 2. Create a Feature Branch  
Always work in a **dedicated branch** branching of from the branch **development** to isolate your changes. Include your username, the type of your change and a brief description in the branch name: 
**Checkout develompent Branch**
```bash  
git checkout development  
```  
**Create a new Branch**
```bash  
git checkout -b your-username/type/short-description  
```  
**Example:**  
```bash  
git checkout -b jakob/docs/modify_readme  
```  

---

## ✍️ Making Changes  

### 3. Stage and Commit Changes  
After making your edits, add the changes to the staging area and commit them with a descriptive message:  
**Example:** 
```bash  
git add .  
git commit -m "feat(jakobs_test): add a funny file named jakob.txt to the project"  
```  

### 4. Push to Remote  
Push your branch to the remote repository:  
```bash  
git push origin your-username/type/short-description  
```  

---

## 🚀 Creating a Pull Request (PR)  

1. Navigate to the repository on GitHub (the main repo if you’re internal, or your fork if external).  
2. Click **"Compare & pull request"** for your newly pushed branch.  
3. Provide a **clear title** and **detailed description** explaining:  
   - The purpose of your changes.  
   - Any issues or features addressed.  
   - Additional context for reviewers.  

### 🔍 PR Best Practices  
- **Keep PRs focused**: Address one feature/bug per pull request.  
- **Tag relevant reviewers**: Use `@mentions` to notify team members.  
- **Respond to feedback**: Discuss suggestions in the PR’s comment section.  

---

## 🔄 Keeping Your Branch Updated  

### Merge `development` into your feature branch **daily!**

To avoid merge conflicts and keep your work up to date with the latest changes, **you should merge the `development` branch into your feature branch at least once a day!**.  
This should be a **daily routine!**:

- ✅ **First thing in the morning**
- ✅ **Last thing before creating a Pull Request**

**Steps to update your branch:**

```bash
# Make sure you're on your feature branch
git checkout your-username/type/short-description

# Fetch the latest changes from remote
git fetch origin

# Merge development into your current branch
git merge origin/development
```

Resolve any conflicts that come up and test your changes to ensure everything still works correctly.

---

## ✅ Post-PR Workflow  

- **Review Process**: The lead developer or team will review your changes.  
- **Resolve Feedback**: Update your branch if revisions are requested.  
- **Merge or Close**: Once approved, the PR will be merged into main by the lead developer or maintainers. If the changes are deemed unnecessary, it may be closed.  

---

## 🧹 Branch Cleanup Best Practices  

### **Should You Delete Merged Branches?**  
**Yes, in most cases.** Here’s why and how:  

1. **Why Delete Merged Branches?**  
   - ✅ **Reduces clutter**: Avoids an overwhelming list of inactive branches.  
   - ✅ **Prevents confusion**: Ensures only active/important branches remain visible.  
   - ✅ **Avoids accidental reuse**: Old branches might contain outdated code or conflicts.  

2. **Exceptions (When to Keep Branches):**  
   - 🌿 **Long-term branches**: E.g., `dev`, `staging`, or version-specific branches like `v2.0`.  
   - 🛠️ **Ongoing work**: Branches tied to multi-PR features still in progress.  
   - 🏷️ **Tagged releases**: Branches associated with specific releases (e.g., `release-1.3.0`).  

---

### **How to Delete Branches**  

#### 1. Delete Locally  
After merging, remove the branch from your machine:  
```bash  
git checkout main         # Switch to main first  
git pull                  # Always pull to confirm that everything is up to date (your branch is correctly merged into the main branch).  
git branch -d branch_name # Delete the local branch  
```  

#### 2. Delete Remotely  
Remove the branch from GitHub:  
```bash  
git push origin --delete branch_name  
```  

---

## 💡 Tips for Effective Collaboration  

- **Sync Frequently**: Regularly pull the latest `main` branch to avoid conflicts:  
  ```bash  
  git checkout main  
  git pull origin main  
  ```  
- **Write Clear Commit Messages**: Explain the **why**, not just the *what*.  
- **Test Locally**: Verify changes work before submitting a PR.  

---

**Happy Coding!** 🎉  
Let’s build something amazing together. For advanced workflows, refer to [GitHub’s Collaboration Guide](https://docs.github.com/en/get-started/quickstart/github-flow).  