<template>
  <a-layout-footer class="footer">
    <div class="footer-content">
      <p class="copyright">
        <a
          href="https://space.bilibili.com/521182571"
          target="_blank"
          rel="noopener noreferrer"
          class="author-link"
        >
          Mango Gen
        </a>
      </p>
    </div>
  </a-layout-footer>
</template>

<script setup lang="ts">
// 无需额外的响应式数据
</script>

<style scoped>
.footer {
  background: var(--bg-primary);
  text-align: center;
  padding: 16px;
  border-top: 1px solid var(--border-color);
  height: 60px;
  line-height: 28px;
}

.copyright {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.author-link {
  color: var(--primary-color);
  text-decoration: none;
}

.author-link:hover {
  color: var(--primary-dark);
  text-decoration: underline;
}
</style>
