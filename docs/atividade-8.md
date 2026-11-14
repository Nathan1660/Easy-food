# Atividade 8 — Cadastro de pratos e imagens

## Correção do cadastro

O commit [70e459e](https://github.com/FelipeDiasR/easy-food/commit/70e459efbdc880815f131ebe3e4c92e39efb6270), no topo da main do professor, alterou o schema Prisma, a migração add_restaurant_owner, os controllers e os services de restaurantes e pratos.

Antes, a validação de criação exigia imageUrl no JSON. O envio do prato sem a foto recebia HTTP 400. A correção separou o cadastro da imagem e gravou inicialmente uma string vazia, pois a coluna ainda era obrigatória. Também associou o restaurante ao usuário autenticado e passou a verificar a propriedade nas operações do cardápio. Na implementação atual, a migração anterior permite imageUrl nulo e converte as strings vazias existentes.

## Organização

As rotas encadeiam JWT, Multer e controller. O controller interpreta a requisição e traduz o resultado para HTTP. O service de cada módulo decide qual registro atualizar e persiste o caminho. O serviço compartilhado valida, redimensiona, converte e armazena imagens de pratos e perfis. Uma mudança no formato ou no limite de processamento pode ser aplicada em um único lugar.

O JWT define a identidade usada no upload de perfil. O módulo de pratos também verifica a propriedade do restaurante. Quando a imagem é inválida, o caminho anterior permanece no banco. Se a atualização no banco falhar, a aplicação tenta remover o arquivo recém-gerado. Uma imagem substituída é removida após a atualização do registro.

## Reprodução

Cadastre uma conta, obtenha o JWT e cadastre um restaurante. Envie um prato com nome, descrição e preço a POST /restaurants/:restaurantId/dishes e espere 201. Envie um JPEG, PNG ou WebP de até 5 MB no campo multipart image para POST /auth/me/image e POST /dishes/:dishId/image. Consulte GET /auth/me e o cardápio para recuperar os caminhos, e abra os arquivos no mesmo host da API. Os dois uploads retornam 401 sem JWT. Arquivos inválidos retornam 400, arquivos acima do limite retornam 413 e um upload válido para prato inexistente retorna 404.
