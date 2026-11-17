# DataAsk 全栈镜像：Trino + Wren + FastAPI 后端 + MCP 网关
# 构建：docker build -f docker/Dockerfile.app -t dataask-app .
#
# 国内网络优化：apt 走阿里云、pip 走清华、Trino 走阿里云 Maven。
# 海外构建可加 --build-arg CN_MIRROR=0 换回官方源。

# Trino 476 需要 Java 24+，直接从官方镜像取，构建机无需预装 JDK
FROM eclipse-temurin:25-jdk AS jdk

FROM python:3.11-slim-bookworm

ARG CN_MIRROR=1

ENV DEBIAN_FRONTEND=noninteractive \
    JAVA_HOME=/opt/java \
    PATH=/opt/java/bin:$PATH \
    DATA_DIR=/data/config \
    PROJECTS_DIR=/data/work \
    CATALOG_DIR=/opt/trino/etc/catalog \
    TRINO_LAUNCHER=/opt/trino/bin/launcher \
    TRINO_URL=http://127.0.0.1:8888 \
    TRINO_HOST=127.0.0.1 \
    TRINO_PORT=8888 \
    PYTHONUNBUFFERED=1

COPY --from=jdk /opt/java/openjdk /opt/java

# apt：国内换阿里云，否则 bookworm 源很慢
RUN if [ "$CN_MIRROR" = "1" ]; then \
      sed -i 's|deb.debian.org|mirrors.aliyun.com|g' /etc/apt/sources.list.d/debian.sources 2>/dev/null || true; \
      sed -i 's|deb.debian.org|mirrors.aliyun.com|g' /etc/apt/sources.list 2>/dev/null || true; \
    fi \
    && apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates procps \
    && rm -rf /var/lib/apt/lists/*

# ── Trino 476 ──
ARG TRINO_VERSION=476
RUN curl -fL --retry 3 -o /tmp/trino.tgz \
        "https://maven.aliyun.com/repository/central/io/trino/trino-server/${TRINO_VERSION}/trino-server-${TRINO_VERSION}.tar.gz" \
    && mkdir -p /opt/trino \
    && tar -xzf /tmp/trino.tgz -C /opt/trino --strip-components=1 \
    && rm /tmp/trino.tgz \
    && mkdir -p /opt/trino/data /opt/trino/etc/catalog

# Trino 配置（node/jvm/config 三件套 + 空 catalog 目录）
COPY docker/trino-etc/ /opt/trino/etc/

# ── 后端依赖 ──
WORKDIR /app
COPY wren-console/backend/requirements.txt /app/requirements.txt

RUN if [ "$CN_MIRROR" = "1" ]; then \
      pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple; \
    fi \
    && pip install --no-cache-dir "wrenai[trino]>=0.17.1" "trino>=0.330" \
    && pip install --no-cache-dir -r /app/requirements.txt

COPY wren-console/backend/app /app/app
COPY wren-console/scripts/seed_autodemo.py /app/scripts/seed_autodemo.py
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8000 8888 9300 9301

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
