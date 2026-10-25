# CLI SVG Editor

一个用 TypeScript 编写的命令行 SVG 编辑器。支持创建、读取和保存 SVG，内置 rect、circle、ellipse、line、text、g 六类元素，并提供移动、缩放、分组、删除、属性修改、结构查看和撤销重做。

## 环境

- Node.js 20 或更高版本
- npm 或 pnpm

## 运行

~~~bash
npm install
npm run cli
~~~

也可以把命令文件通过标准输入回放：

~~~bash
npm run build
node dist/cli/main.js < examples/flowchart.commands.txt
~~~

## 测试

~~~bash
npm run check
~~~

当前测试覆盖命令编辑、层级操作、错误原子性、undo/redo、外部 SVG 自动补 id 和保存读回一致性。

## 示例

- **examples/flowchart.commands.txt**：可回放的两节点流程图命令
- **examples/flowchart.svg**：对应的 SVG 输出
- **doc/README.md**：架构方案、开发过程记录、一致性自查和质量保证说明
