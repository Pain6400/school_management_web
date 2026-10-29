const fs = require('fs');
let content = fs.readFileSync('src/components/app-sidebar.tsx', 'utf8');

const target = `<SidebarMenuButton
          render={<Link href={item.url || "#"} />}
          className={\`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.98] \${
            isActive
              ? "bg-neutral-100/90 text-neutral-950 font-semibold shadow-2xs"
              : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50"
          }\`}
        >
          <div
            className={\`w-1 h-4 rounded-full transition-[opacity,transform] duration-150 ease-out \${
              isActive ? "bg-neutral-950 opacity-100" : "opacity-0 -ml-1"
            }\`}
          />
          <item.icon className={\`size-4 \${isActive ? "text-neutral-950" : "text-neutral-500"}\`} />
          <span className="flex-1 truncate">{item.title}</span>
          {item.badge && (
            <span
              className={\`text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums font-mono \${
                isActive
                  ? "bg-neutral-950 text-white"
                  : "bg-neutral-200/80 text-neutral-700"
              }\`}
            >
              {item.badge}
            </span>
          )}
        </SidebarMenuButton>`;

const replacement = `<Link
          href={item.url || "#"}
          className={\`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.98] \${
            isActive
              ? "bg-neutral-100/90 text-neutral-950 font-semibold shadow-2xs"
              : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50"
          }\`}
        >
          <div
            className={\`w-1 h-4 rounded-full transition-[opacity,transform] duration-150 ease-out \${
              isActive ? "bg-neutral-950 opacity-100" : "opacity-0 -ml-1"
            }\`}
          />
          <item.icon className={\`size-4 \${isActive ? "text-neutral-950" : "text-neutral-500"}\`} />
          <span className="flex-1 truncate">{item.title}</span>
          {item.badge && (
            <span
              className={\`text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums font-mono \${
                isActive
                  ? "bg-neutral-950 text-white"
                  : "bg-neutral-200/80 text-neutral-700"
              }\`}
            >
              {item.badge}
            </span>
          )}
        </Link>`;

if (content.includes('SidebarMenuButton')) {
  // normalize newlines
  const isCRLF = content.includes('\r\n');
  const normalizedContent = content.replace(/\r\n/g, '\n');
  const normalizedTarget = target.replace(/\r\n/g, '\n');
  const normalizedReplacement = replacement.replace(/\r\n/g, '\n');

  if (normalizedContent.includes(normalizedTarget)) {
    let replaced = normalizedContent.replace(normalizedTarget, normalizedReplacement);
    if (isCRLF) replaced = replaced.replace(/\n/g, '\r\n');
    fs.writeFileSync('src/components/app-sidebar.tsx', replaced, 'utf8');
    console.log('Successfully replaced SidebarMenuButton with native Link in app-sidebar.tsx!');
  } else {
    console.log('Normalized target not found in app-sidebar.tsx');
  }
}

