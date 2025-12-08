# Contributing to Cemetery Blockchain

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive criticism
- Prioritize community benefit

## How to Contribute

### Reporting Bugs

1. **Search existing issues** to avoid duplicates
2. **Use the bug report template**
3. **Include**:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, browser)
   - Screenshots if applicable

### Suggesting Features

1. **Check existing feature requests**
2. **Open a new issue** with:
   - Clear use case
   - Benefits to users
   - Possible implementation approach
   - Mockups/examples if applicable

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Write/update tests**
5. **Run all tests**:
   ```bash
   npx hardhat test
   ```
6. **Commit with clear messages**:
   ```bash
   git commit -m "Add feature: description"
   ```
7. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Open a Pull Request**

## Development Guidelines

### Code Style

#### Solidity
- Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Use NatSpec comments
- Write descriptive variable names
- Maximum line length: 120 characters

```solidity
/**
 * @dev Reserve a grave plot with payment
 * @param _graveId ID of the grave to reserve
 * @param _metadataHash IPFS hash containing burial metadata
 */
function reserveGrave(uint256 _graveId, string calldata _metadataHash)
    external
    payable
    nonReentrant
{
    // Implementation
}
```

#### JavaScript/React
- Use ESLint configuration
- Prefer `const` over `let`
- Use meaningful variable names
- Add comments for complex logic

```javascript
// Good
const availableGraves = graves.filter(grave => !grave.reserved);

// Avoid
const g = graves.filter(x => !x.r);
```

### Testing

#### Smart Contracts

All smart contract changes must include tests:

```javascript
describe("Feature", function() {
  it("Should perform expected action", async function() {
    // Arrange
    const input = setupInput();

    // Act
    await contract.performAction(input);

    // Assert
    expect(await contract.getResult()).to.equal(expectedValue);
  });
});
```

#### Coverage Requirements
- Minimum 90% code coverage
- Test all edge cases
- Test security scenarios

Run coverage:
```bash
npx hardhat coverage
```

### Commit Messages

Use conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(contracts): add batch grave creation

fix(frontend): resolve wallet connection issue

docs(readme): update installation instructions
```

### Branch Naming

- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/documentation-update` - Documentation
- `refactor/code-improvement` - Refactoring

## Project Structure

```
cemetery-blockchain/
├── contracts/          # Solidity smart contracts
├── test/              # Smart contract tests
├── scripts/           # Deployment scripts
├── backend/           # Node.js backend
│   └── src/
│       ├── routes/    # API routes
│       ├── config/    # Configuration
│       └── utils/     # Utility functions
├── frontend/          # React frontend
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── context/
│       └── utils/
├── geo/               # GeoJSON data
└── docs/              # Documentation
```

## Review Process

1. **Automated Checks**
   - CI/CD pipeline runs tests
   - Linting checks
   - Build verification

2. **Code Review**
   - At least one maintainer approval required
   - Address all review comments
   - Keep PR focused and small

3. **Merge**
   - Squash commits if needed
   - Update changelog
   - Delete branch after merge

## Development Workflow

### Setting Up Development Environment

1. **Clone and install**:
   ```bash
   git clone https://github.com/yourusername/cemetery-blockchain.git
   cd cemetery-blockchain
   npm install
   cd backend && npm install && cd ..
   cd frontend && npm install && cd ..
   ```

2. **Start local blockchain**:
   ```bash
   npx hardhat node
   ```

3. **Deploy contracts**:
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

4. **Start backend**:
   ```bash
   cd backend && npm run dev
   ```

5. **Start frontend**:
   ```bash
   cd frontend && npm run dev
   ```

### Making Changes

1. **Create feature branch**
2. **Make changes**
3. **Test thoroughly**:
   ```bash
   # Smart contracts
   npx hardhat test

   # Backend (if you add backend tests)
   cd backend && npm test
   ```
4. **Commit and push**
5. **Open PR**

## Specific Contribution Areas

### Smart Contract Development

- Follow security best practices
- Use OpenZeppelin libraries where possible
- Document all functions with NatSpec
- Add comprehensive tests
- Consider gas optimization

### Frontend Development

- Maintain responsive design
- Ensure accessibility (WCAG 2.1)
- Add loading states
- Handle errors gracefully
- Test on multiple browsers

### Backend Development

- RESTful API design
- Input validation
- Error handling
- Rate limiting
- API documentation

### Documentation

- Keep README up to date
- Add inline code comments
- Update API documentation
- Write clear guides
- Add examples

## Questions?

- **GitHub Discussions**: For general questions
- **GitHub Issues**: For bugs and feature requests
- **Email**: dev@example.com

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Thanked in our community

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Cemetery Blockchain!** 🎉
