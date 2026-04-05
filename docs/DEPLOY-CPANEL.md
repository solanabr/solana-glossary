# Deploy em cPanel

Este guia explica como fazer deploy do Tokenfy Me em hospedagem cPanel.

## Pré-requisitos

### cPanel com Node.js (Recomendado)
- cPanel com suporte a Node.js Application
- Node.js 18+ instalado no servidor
- Pelo menos 512MB de RAM disponível

### cPanel sem Node.js (Alternativo)
- Hospedagem compartilhada padrão
- Requer modificações no projeto (ver seção "Export Estático")

---

## Opção 1: Deploy com Node.js (Standalone)

### 1. Preparar o Build

```bash
# Instalar dependências
npm install

# Criar arquivo .env.local com as variáveis de produção
cp .env.example .env.local
# Editar .env.local com valores de produção

# Gerar o build
npm run build
```

### 2. Configurar cPanel

1. Acesse cPanel → **Setup Node.js App**
2. Clique em **Create Application**
3. Configure:
   - **Node.js version**: 18.x ou superior
   - **Application mode**: Production
   - **Application root**: /home/usuario/memecoin
   - **Application URL**: seu-dominio.com
   - **Application startup file**: server.js

### 3. Upload dos Arquivos

Faça upload das seguintes pastas/arquivos para o servidor:

```
memecoin/
├── .next/standalone/    # Build do Next.js
├── .next/static/        # Arquivos estáticos
├── public/              # Assets públicos
├── .env.local           # Variáveis de ambiente
└── package.json         # Dependências
```

### 4. Configurar Servidor

Crie o arquivo `server.js` na raiz:

```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('./.next/standalone/node_modules/next');

const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(process.env.PORT || 3000, (err) => {
    if (err) throw err;
    console.log('> Ready on port ' + (process.env.PORT || 3000));
  });
});
```

### 5. Iniciar Aplicação

No cPanel Node.js App, clique em **Run NPM Install** e depois **Start App**.

---

## Opção 2: Export Estático (Sem Node.js)

> ⚠️ **Atenção**: Esta opção tem limitações. A API route `/api/contract-source` não funcionará e precisará ser convertida.

### 1. Modificar next.config.ts

```typescript
const DEPLOY_MODE: 'standalone' | 'export' = 'export';
```

### 2. Gerar Build Estático

```bash
npm run build
```

Isso gerará a pasta `out/` com os arquivos estáticos.

### 3. Upload para cPanel

1. Faça upload do conteúdo da pasta `out/` para `public_html/`
2. Configure o `.htaccess` para roteamento:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Redirecionar para pasta do locale padrão
  RewriteRule ^$ /pt-BR/ [L,R=301]

  # Servir arquivos estáticos diretamente
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Fallback para páginas HTML
  RewriteRule ^(.*)$ /$1.html [L]
</IfModule>
```

### 4. Limitações do Export Estático

- ❌ API routes não funcionam
- ❌ Páginas com getServerSideProps não funcionam
- ❌ Middleware não funciona
- ✅ Páginas estáticas funcionam
- ✅ Client-side rendering funciona
- ✅ Chamadas a APIs externas funcionam

---

## Variáveis de Ambiente (.env.local)

```env
# Network Mode: 'testnet' ou 'mainnet'
NEXT_PUBLIC_NETWORK_MODE=mainnet

# WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=seu_project_id

# RPCs (use seus próprios endpoints para produção)
NEXT_PUBLIC_ETH_MAINNET_RPC=https://eth.llamarpc.com
NEXT_PUBLIC_BASE_MAINNET_RPC=https://mainnet.base.org

# Factory Contracts (OBRIGATÓRIO para mainnet)
NEXT_PUBLIC_FACTORY_MAINNET=0x...
NEXT_PUBLIC_FACTORY_BASE_MAINNET=0x...

# Admin Wallet
NEXT_PUBLIC_ADMIN_WALLET=0x...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# API Keys (para verificação de contratos)
NEXT_PUBLIC_ETHERSCAN_API_KEY=xxx
NEXT_PUBLIC_BASESCAN_API_KEY=xxx
```

---

## Checklist de Deploy

- [ ] Contratos factory deployados na mainnet
- [ ] Variáveis de ambiente configuradas
- [ ] Network mode definido como 'mainnet' no Admin
- [ ] Build gerado sem erros
- [ ] Arquivos uploadados para o servidor
- [ ] SSL/HTTPS configurado no domínio
- [ ] Testado login com carteira
- [ ] Testado criação de token (testnet primeiro!)

---

## Troubleshooting

### Erro 500 ou página em branco
- Verifique se o Node.js está rodando corretamente
- Confira os logs do Node.js App no cPanel
- Verifique se todas as variáveis de ambiente estão configuradas

### Erro de CORS
- Configure headers CORS no servidor
- Verifique se os domínios estão corretos nas variáveis de ambiente

### Imagens não carregam
- Verifique se a pasta `public/` foi uploadada
- Confira permissões dos arquivos (644 para arquivos, 755 para pastas)

### Carteira não conecta
- Verifique se o WalletConnect Project ID está correto
- Confirme que o domínio está autorizado no WalletConnect Cloud
