# How to Contribute to a GitHub Repository  

This guide outlines the collaborative workflow for contributing to this repository. Follow these steps to ensure smooth collaboration and code integration.  

For our naming conventions and commit-/ branch-rules please check out:
[![GIT_GUIDELINES](https://img.shields.io/badge/GIT-Guidelines-blue.svg)](https://github.com/peer-network/.github/blob/main/GIT_GUIDELINES.md)

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
3. Provide a **clear title** and **detailed description** (see [![GIT_GUIDELINES](https://img.shields.io/badge/GIT-Guidelines-blue.svg)](GIT_GUIDELINES.md) for more details)

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
- **Merge or Close**: Once approved, the PR will be merged and the branch should be removed afterwards.
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

- **Write Clear Commit Messages**: Explain the **why**, not just the *what*.  
- **Test Locally**: Verify changes work before submitting a PR.  

---

**Happy Coding!** 🎉  
Let’s build something amazing together.