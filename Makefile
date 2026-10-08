.PHONY: compose-up compose-down compose-prod-up compose-prod-down prod

compose-up:
	docker compose -f docker-compose.yml up --build -d
	@echo ""
	@echo "TrAIce development stack draait op:"
	@echo "- http://localhost:8080"

compose-down:
	docker compose -f docker-compose.yml down

compose-prod-up:
	docker compose -f docker-compose.prod.yml up --build -d
	@echo ""
	@echo "TrAIce production-like stack draait op:"
	@echo "- https://localhost:8443"
	@echo "- http://localhost:8080 (redirect naar HTTPS)"
	@echo ""
	@echo "Let op: lokaal wordt een self-signed certificaat gebruikt."

compose-prod-down:
	docker compose -f docker-compose.prod.yml down

prod: compose-prod-up
