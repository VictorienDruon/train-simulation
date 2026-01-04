.PHONY: standalone web

standalone:
	cd go/cmd/standalone && go run main.go

web:
	cd go/cmd/wasm && GOOS=js GOARCH=wasm go build -o ../../../web/public/simulation.wasm
	cd web && pnpm run dev
