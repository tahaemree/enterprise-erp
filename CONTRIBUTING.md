# Contributing to NexusERP

First off, thank you for considering contributing to NexusERP! It's people like you that make NexusERP a great tool for enterprise resource planning.

## 1. Where do I go from here?

If you've noticed a bug or have a feature request, make one! It's generally best if you get confirmation of your bug or approval for your feature request before starting to code.

## 2. Fork & create a branch

If this is something you think you can fix, then fork NexusERP and create a branch with a descriptive name.

A good branch name would be (where issue #325 is the ticket you're working on):

```sh
git checkout -b 325-add-stripe-integration
```

## 3. Get the test suite running

Make sure you have all dependencies installed and the database seeded:

```bash
npm install
npm run setup
```

Run the tests to ensure everything is working:

```bash
npm run test
```

## 4. Implement your fix or feature

At this point, you're ready to make your changes. Feel free to ask for help; everyone is a beginner at first.

## 5. Make a Pull Request

At this point, you should switch back to your master branch and make sure it's up to date with NexusERP's master branch:

```sh
git remote add upstream git@github.com:tahaemree/enterprise-erp.git
git checkout master
git pull upstream master
```

Then update your feature branch from your local copy of master, and push it!

```sh
git checkout 325-add-stripe-integration
git rebase master
git push --set-upstream origin 325-add-stripe-integration
```

Finally, go to GitHub and make a Pull Request.

## 6. Keeping your Pull Request updated

If a maintainer asks you to "rebase" your PR, they're saying that a lot of code has changed, and that you need to update your branch so it's easier to merge.

## Coding Style

- We use **Prettier** for code formatting. Run `npm run format` before committing.
- We use **ESLint** for linting. Run `npm run lint` to check for errors.
- Ensure all new features are covered by **Vitest** or **Playwright** tests.
