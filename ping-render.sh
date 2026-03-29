#!/bin/bash
curl -s https://criativalia-runtime.onrender.com/api/stats -o /dev/null -w "%{http_code}"