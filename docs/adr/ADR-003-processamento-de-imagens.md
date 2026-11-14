# ADR-003 Processar imagens dentro da API EasyFood

## Status

Aceita em 12/11/2026.

## Contexto

O cardápio precisa exibir imagens dos pratos. Imagens originais de alta resolução aumentam o volume de dados transferidos. O cadastro do prato é independente do upload, o que permite incluir ou trocar a foto depois.

## Alternativas consideradas

| Alternativa | Implicação |
| --- | --- |
| Processar na API | Reaproveita o servidor e compartilha CPU e memória com as rotas HTTP. |
| Serviço independente | Isola a carga e permite escalar separadamente, com outro serviço para implantar, monitorar e integrar. |
| Serverless ou FaaS | Permite executar sob demanda, com configuração de gatilhos, permissões e armazenamento externo. |

## Decisão e justificativa

O Multer recebe a imagem e o Sharp corrige a orientação, limita a largura a 800 pixels e gera um WebP com qualidade 80. A API armazena o arquivo localmente e grava o caminho no PostgreSQL. O volume inicial e o contexto acadêmico favorecem reaproveitar a infraestrutura e reduzir os componentes envolvidos.

## Consequências e revisão

A implementação e a execução local ficam concentradas na aplicação existente. O processamento consome CPU e memória do mesmo processo que atende outras requisições. O armazenamento local pressupõe um disco persistente acessível à instância que serve as imagens. Reavaliar a decisão se o volume afetar a latência das rotas ou se a aplicação passar a executar em múltiplas instâncias.
