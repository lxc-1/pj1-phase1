# CLI SVG Editor 项目说明

## 架构方案

### 模块划分

| 目录 | 职责 |
|---|---|
| **src/domain** | SVG 文档与图形对象、组合树、图形工厂、XML 解析与序列化、tree/show 渲染。这里不依赖命令行和文件系统。 |
| **src/application** | 编辑会话、命令对象、undo/redo 历史和外部能力端口。负责组织用例，不直接调用 Node 文件 API。 |
| **src/infrastructure** | FilePort 的文件系统实现，隔离 node:fs/promises。 |
| **src/cli** | 参数分词、命令分发、帮助文本和 REPL；main.ts 同时是组合根，负责注入 FileGateway。 |
| **src/test** | 命令行为、层级变化、错误原子性和 SVG 往返测试。 |
| **examples** | 可直接回放的命令文件和对应 SVG 结果。 |

~~~plantuml
@startuml
skinparam componentStyle rectangle

package "CLI adapter" {
  [main / REPL]
  [CommandDispatcher]
  [CommandLineTokenizer]
}

package "Application" {
  [EditorSession]
  [CommandManager]
  [Editing Commands]
  interface FilePort
}

package "Domain" {
  [SvgDocument]
  [Shape hierarchy]
  [ShapeFactory]
  [SVG Parser / Serializer]
  [Tree / Show Renderer]
}

package "Infrastructure" {
  [FileGateway]
}

[main / REPL] --> [CommandDispatcher]
[CommandDispatcher] --> [EditorSession]
[EditorSession] --> [CommandManager]
[CommandManager] --> [Editing Commands]
[Editing Commands] --> [SvgDocument]
[EditorSession] --> [SVG Parser / Serializer]
[SvgDocument] --> [Shape hierarchy]
[SVG Parser / Serializer] --> [ShapeFactory]
[FileGateway] ..|> FilePort
[main / REPL] --> [FileGateway]
[EditorSession] --> FilePort
@enduml
~~~

### 设计模式

**Command**

每个可编辑操作都是独立命令类，例如 CreateCommand、MoveCommand、GroupCommand。CommandDispatcher 只负责把命令名和参数转换成命令对象，CommandManager 统一执行并维护 undo/redo 栈。一条 CLI 编辑命令对应一个历史单元，group 等多对象操作不会拆散。

**Memento**

SnapshotCommand 在执行前后保存 SvgDocument 深拷贝。执行失败时立即恢复执行前快照，因此错误命令不会留下半完成状态；undo 和 redo 也通过已保存的前后快照恢复。这个实现用内存换取了简单、可验证的原子性，适合 Phase 1 的文档规模。

**Composite**

Shape 是叶子与容器的共同抽象，GroupShape 同时实现 Shape 和 ShapeContainer。move、scale、delete、set 等命令只面向 Shape；组的移动和缩放通过多态递归到子节点，不在命令层按标签写分支。

**Factory**

ShapeFactory 是唯一的图形类型分派点，负责 create 参数和 SVG 元素到具体类的构造。Phase 1 仍使用 switch，后续增加插件时可以替换为 provider 注册表。按名字分派只保留在 CommandDispatcher 与 ShapeFactory 两个明确位置。

**Ports and Adapters**

应用层声明 FilePort，FileGateway 在基础设施层实现它，由 CLI 组合根注入 EditorSession。这样测试和后续存储实现不需要修改应用逻辑。

### 依赖方向规则

| 来源模块 | 允许依赖 | 不允许依赖 | 原因 |
|---|---|---|---|
| domain | domain 内部 | application、cli、infrastructure | 领域模型应能脱离交互和 IO 独立运行。 |
| application | domain、application 内部端口 | cli、具体 infrastructure 实现 | 用例层只使用抽象能力，不绑定终端和文件系统。 |
| infrastructure | application 端口、平台 API | cli、命令实现细节 | 基础设施只负责适配外部系统。 |
| cli | application、domain 的错误/数值类型、infrastructure 组合 | 无额外限制 | CLI 是最外层适配器和组合根。 |
| test | 全部生产模块 | 无 | 测试需要从外部验证组合行为。 |

自查脚本确认 application 目录没有导入 infrastructure；当前依赖方向与表中规则一致。

### 变化点假设

1. **图形类型会增加**：当前把构造集中在 ShapeFactory，后续可以改成 ShapeProvider 注册表。Phase 1 不提前实现插件加载，避免为了未交付的 box 引入额外复杂度。
2. **交互入口会增加**：命令对象和 EditorSession 不依赖 readline，未来 GUI、HTTP 或 agent 调用可以复用同一用例层。
3. **存储方式会变化**：FilePort 已把文件操作隔离，后续可接内存、云存储或带版本的仓库实现。
4. **历史策略会变化**：当前整文档快照实现清晰可靠；文档很大时可将命令改为保存最小逆操作，而不改变 CommandManager 的调用方式。
5. **SVG 支持范围会扩大**：当前只处理要求内的六类元素和公开属性。path、use、滤镜及完整 transform 语义留到后续扩展；遇到未知元素会明确报错，不静默丢失节点。

## 过程记录

下面只记录对实现有实际影响的几次调整。

| 阶段 | 发现的问题 | 处理与验证 |
|---|---|---|
| 需求拆分 | init/read/save/canvas 与普通编辑命令的历史语义不同，如果共用一个栈容易跨文档撤销。 | 把 IO 边界放进 CommandManager；IO 成功后清空历史并锁定 undo，下一条成功编辑再开启。相关行为有独立测试。 |
| 命令实现 | group、delete 等操作涉及多处树修改，手写逆操作容易遗漏父节点和顺序。 | 采用 Command + Memento；命令失败恢复前快照，group 整体只占一个 undo 单元。 |
| 依赖检查 | 初版 EditorSession 直接创建 FileGateway，应用层依赖了基础设施。 | 增加 FilePort，由 main.ts 注入 FileGateway；重新扫描 application 导入并跑完测试。 |
| SVG 往返 | 初版解析器对 text 内容调用 trim，会改变合法的前后空格；缺省几何属性也过于严格。 | 保留原始文本，并按 SVG 常见规则将缺省几何值设为 0；保存读回测试保持通过。 |
| Windows 回放 | PowerShell 默认管道编码把示例中的中文变成问号。 | 用 UTF-8 管道复现和定位，确认编辑器保存正常，并增加中文 set 命令测试。 |
| 测试脚本 | 最初脚本内部再次调用 npm，在只有 pnpm 的环境无法执行；Node 的目录测试参数在 Windows 下也不稳定。 | 脚本直接调用 tsc 和 node，并显式列出测试文件；npm run 与 pnpm 均可使用。 |

AI 在这里主要用于方案对比、生成初稿和补测试场景。每次修改都以 TypeScript 编译、命令回放或断言结果为准；发现建议与依赖规则或运行环境不一致时，先改代码再记录结论，没有直接把未验证的建议留在最终实现里。

## 一致性自查

### 模块划分

实际目录与方案一致：domain、application、infrastructure、cli、test 和 examples 均已落地。开发中唯一明显修订是将文件系统依赖从 EditorSession 移到 FilePort + FileGateway；该修订已经反映在组件图和依赖规则中。

### 依赖方向

- domain 没有导入 application、cli 或 infrastructure。
- application 没有导入 cli 或具体 infrastructure。
- infrastructure 只实现 application/ports/FilePort。
- CLI 作为外层负责创建 FileGateway 并注入 EditorSession。
- switch 分派只出现在 CommandDispatcher 和 ShapeFactory；后者分别用于 create 和 read 两条构造路径。
- 生产代码保持一类一文件；接口文件单独存放。

当前未发现违反既定依赖规则的引用。

## 功能完整性

| 类别 | 已实现 |
|---|---|
| 文档 | init、read、save、canvas 查询与修改 |
| 图形 | rect、circle、ellipse、line、text、g；create 支持 in 子句 |
| 编辑 | delete、move、scale、set、group、ungroup、addto、front、back |
| 查看 | tree、tree 指定子树、show、help |
| 历史 | undo、redo、undo 后新编辑清空 redo、IO 边界限制 |
| 导入 | 缺 id 自动生成并警告、重复 id 拒绝、XML 实体解码 |
| 导出 | 标准 SVG 头、画布属性、嵌套组、文本与属性转义 |
| 错误 | 统一由 CLI 输出 error: 前缀；失败编辑不改变文档状态 |

box 明确属于后续插件阶段，本版本按规范返回 unknown shape type。

## 质量保证手段

1. **严格类型检查**：tsconfig 开启 strict、noUncheckedIndexedAccess 和 exactOptionalPropertyTypes；npm run check 会先执行完整编译。
2. **自动化测试**：11 个测试覆盖六类图形、组合结构、z-order、删除恢复、错误原子性、redo 清空、IO 历史边界、缺 id、重复 id、中文文本和保存读回。
3. **真实命令回放**：examples/flowchart.commands.txt 通过标准输入运行，生成 examples/flowchart.svg，再由 read 命令读回并比较结构。
4. **架构扫描**：检查 switch 位置、应用层到基础设施的导入和一类一文件情况，防止实现逐步退化成过程式分派。
5. **错误路径检查**：重复 id、非法缩放、未知属性、错误容器、祖先与子孙同时分组、文件读写失败均有明确错误，且关键错误场景验证了状态不变。

本地最终检查命令：

~~~bash
npm run check
~~~

预期结果为 TypeScript 编译成功，11 个测试全部通过。
