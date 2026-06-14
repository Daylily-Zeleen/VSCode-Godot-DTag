# Godot DTag - VS Code 扩展

为 [Godot-DTag](https://github.com/DaylilyZeleen/Godot-DTag)（`.dtag`）定义文件提供在**VSCode**中的语法高亮和实时错误诊断。

>[Godot-DTag](https://github.com/DaylilyZeleen/Godot-DTag) 是一个类似 Unreal Engine GameplayTag 的 Godot 标签系统。

## 功能特性

- **语法高亮** — 域定义（`@Name`）、标签、重定向（`->`）、注释（`#`、`##`）
- **实时诊断** — 在 VS Code 问题面板中即时显示错误：
  - 空格缩进检测（必须使用制表符 Tab）
  - 无效标识符
  - 缩进/作用域错误
  - 重复标识符检测
  - 重定向目标校验

## 环境要求

- VS Code 1.85+
- 项目中已安装 Godot-DTag 插件

## 使用方法

安装扩展后，打开任意 `.dtag` 文件即可自动启用语法高亮和诊断。

## 安装方式

### 开发模式（用于调试）

1. **安装依赖并编译**
   ```bash
   npm install
   npx tsc -p tsconfig.json
   ```

2. **在 VS Code 中按 `F5` 启动调试**
   这会打开一个新的 **Extension Development Host** 窗口，该窗口已自动加载本扩展。在新窗口中打开任意 `.dtag` 文件即可测试。

3. **增量编译（可选）**
   在 VS Code 中运行终端任务 `npm run watch`，或直接执行以下命令，每次保存源码后自动重新编译：
   ```bash
   npm run watch
   ```

### 打包安装（VSIX）

1. **确保已安装打包工具**
   ```bash
   npm install -g @vscode/vsce
   ```

2. **编译并打包**
   ```bash
   npm install
   npx tsc -p tsconfig.json
   vsce package
   ```
   执行后将在项目根目录生成 `vscode-godot-dtag-1.0.0.vsix` 文件。

3. **安装 VSIX**
   - 打开 VS Code
   - 按 `Ctrl+Shift+P` 打开命令面板
   - 输入并选择 **Extensions: Install from VSIX...**
   - 选择刚才生成的 `.vsix` 文件即可完成安装

## AI 生成内容声明

本项目的部分代码（包括但不限于语法高亮规则、解析器、诊断逻辑等）由 AI 辅助生成。AI 生成内容可能包含潜在错误或不符合最佳实践的实现，请在使用前进行审阅和测试。如有任何问题或改进建议，欢迎提交 Issue 或 Pull Request。
