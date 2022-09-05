---
layout: archive
title: "Publications"
permalink: /publications/
author_profile: false
---

[1] **H. Gao\*, W. Fan\*, L. Qiu, X. Yang, Z. Li, X. Zuo, Y. Li, H. Ren, “SAVAnet: Surgical action-driven visual attention network for autonomous endoscope control”, IEEE Transactions on Automation Science & Engineering (T-ASE), 2022.**

In this work, we learnt from the surgeons’ visual attention mechanism and propose a novel network called SAVAnet to predict visual attention with action guidance. Additionally, we implemented the SAVAnet on a da Vinci simulator to execute the autonomous endoscope control.

[2] **Fan W, Chen J, Ma J, et al. StyleFlow For Content-Fixed Image to Image Translation[J]. arXiv preprint arXiv:2207.01909, 2022.**

[[paper](https://arxiv.org/pdf/2207.01909.pdf)] [[code](https://github.com/weepiess/StyleFlow-Content-Fixed-I2I)]

[3] **Fan W, Yang Y, Qiu K, et al. InvNorm: Domain Generalization for Object Detection in Gastrointestinal Endoscopy[J]. arXiv preprint arXiv:2205.02842, 2022.**

[[paper](https://arxiv.org/pdf/2205.02842.pdf)]

{% if author.googlescholar %}
  You can also find my articles on <u><a href="{{author.googlescholar}}">my Google Scholar profile</a>.</u>
{% endif %}

{% include base_path %}

{% for post in site.publications reversed %}
  {% include archive-single.html %}
{% endfor %}
