# Landing — Webinário (clone de estrutura)

Página de captura/anúncio em **HTML estático** (arquivo único + pasta `assets/`), reconstruída a partir da estrutura de `formacao.focoemsec.com`. Pronta para subir na Vercel.

## Estrutura
```
landing-webinar/
├── index.html      # página completa (HTML + CSS inline + JS de config)
└── assets/         # imagens (logo, instrutor, mockups dos bônus, og:image)
```

## Como personalizar
Tudo o que muda de evento para evento está no bloco `CONFIG` no final do `index.html`:

| Campo | O que faz |
|-------|-----------|
| `whatsappGroupUrl` | **Link do grupo de espera no WhatsApp** — para onde a pessoa é redirecionada após o cadastro. Ex.: `https://chat.whatsapp.com/XXXX` |
| `leadWebhookUrl` | *(opcional)* Endpoint para **salvar o lead** (nome/e-mail/telefone + UTMs). Cole um webhook do Make/Zapier ou uma Edge Function do Supabase. Vazio = só redireciona |
| `videoYoutubeId` | ID do vídeo do YouTube (ex.: `dQw4w9WgXcQ`). Vazio = mostra o placeholder |
| `eventWeekday` | Dia da semana do evento (0=Dom … 2=Ter … 6=Sáb) |
| `eventHour` / `eventTimeLabel` | Hora de início |
| `ticketsByDaysLeft` | Quantos ingressos "restam" conforme a proximidade (escassez) |

### Fluxo de cadastro
O botão **"Quero garantir minha vaga"** abre um modal que coleta **nome, e-mail e WhatsApp**. Ao enviar:
1. valida os campos (e-mail e telefone com DDD) e aplica máscara no telefone;
2. captura UTMs/`fbclid` da URL (útil para o tráfego pago do Instagram);
3. se `leadWebhookUrl` estiver preenchido, envia os dados via POST (JSON);
4. redireciona para `whatsappGroupUrl` (grupo de espera).

- **Textos e preços:** edite direto no HTML (títulos, blocos "Para quem é", "O que você recebe", oferta, instrutor).
- **Imagens:** troque os arquivos em `assets/` mantendo os nomes, ou ajuste os `src`.
- **Pixels (GTM / Facebook):** descomente os blocos no `<head>` e coloque os seus IDs.

## Rodar localmente
Abra `index.html` no navegador, ou sirva a pasta:
```bash
npx serve landing-webinar
```

## Deploy na Vercel
A partir desta pasta:
```bash
vercel deploy --prod
```
Vercel detecta site estático automaticamente — não precisa de build nem `vercel.json`.
