---
layout: archive
title: "Publications"
permalink: /publications/
author_profile: false
---
<style>
img[alt$=">1"] {
  float: right;
  width: 30%;
}
</style>

[Google Scholar Profile](https://scholar.google.com/citations?view_op=list_works&hl=zh-CN&user=ORlELG8AAAAJ)

[1] Yan Tai\*, **Weichen Fan\***, Zhao Zhang, Feng Zhu, Rui Zhao, Ziwei Liu. (2023). Link-Context Learning For Multimodal LLMs. Proceedings of the **AAAI 2024**. [[paper](https://weichenfan.github.io/Weichen//files/Link_Context_Learning_in_Multimodal_LLMs.pdf)][[code](https://github.com/isekai-portal/Link-Context-Learning)]
![image alt >1](https://weichenfan.github.io/Weichen//images/LCL.png)

<br>
<br>
<br>
<br>
<br>

[2] **Weichen Fan\***, Jinghuan Chen\*, Ziwei Liu. (2023). Hierarchy Flow For High-Fidelity Image-to-Image Translation. Proceedings of the **TPAMI**. [[paper](https://weichenfan.github.io/Weichen//files/Hierarchy_Flow_For_High_Fidelity_Image_to_Image_Translation.pdf)][[code](https://github.com/WeichenFan/HierarchyFlow)]
![image alt >1](https://weichenfan.github.io/Weichen//images/HF.png)

<br>
<br>
<br>
<br>
<br>

[3] H. Gao\*, **W. Fan**\*, L. Qiu, X. Yang, Z. Li, X. Zuo, Y. Li, H. Ren, “SAVAnet: Surgical action-driven visual attention network for autonomous endoscope control”, **IEEE Transactions on Automation Science & Engineering (T-ASE)**, 2022. [[paper](https://ieeexplore.ieee.org/document/9895213)]
![image alt >1](https://weichenfan.github.io/Weichen//images/SAVA.png)

In this work, we learnt from the surgeons’ visual attention mechanism and propose a novel network called SAVAnet to predict visual attention with action guidance. Additionally, we implemented the SAVAnet on a da Vinci simulator to execute the autonomous endoscope control.

<br>

[4] **Fan W**, Chen J, Ma J, et al. StyleFlow For Content-Fixed Image to Image Translation[J]. arXiv preprint arXiv:2207.01909, 2022.
![image alt >1](https://weichenfan.github.io/Weichen//images/StyleFLow.png)
[[paper](https://arxiv.org/pdf/2207.01909.pdf)] [[code](https://github.com/weepiess/StyleFlow-Content-Fixed-I2I)]

<br>
<br>
<br>
<br>

[5] **Fan W**, Yang Y, Qiu K, et al. InvNorm: Domain Generalization for Object Detection in Gastrointestinal Endoscopy[J]. arXiv preprint arXiv:2205.02842, 2022.
![image alt >1](https://weichenfan.github.io/Weichen//images/Inv.png)
[[paper](https://arxiv.org/pdf/2205.02842.pdf)]



{% if author.googlescholar %}
  You can also find my articles on <u><a href="{{author.googlescholar}}">my Google Scholar profile</a>.</u>
{% endif %}

{% include base_path %}

{% for post in site.publications reversed %}
  {% include archive-single.html %}
{% endfor %}
